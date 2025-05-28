import User from "../models/user-model.js";

import * as jwt from "../utils/jwt.js";
import * as emailService from "../services/emailService.js";

import { setCookies, removeCookies } from "../utils/cookies.js";

import {
  signUpSchema,
  loginSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  changePasswordSchema,
} from "../validation/authValidation.js";

export const signUp = async (req, res) => {
  try {
    const body = req.body;
    const result = signUpSchema.safeParse(body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.message,
      });
    }
    const { name, username, email, password , confirmPassword } = result.data;

    if(password !== confirmPassword)
    {
       return res.status(401).json({
          success:false,
          message:"Passords don't match!"
       })
    }

    const isExist = await User.findOne({ email });

    if (isExist) {
      return res.status(409).json({
        success: false,
        message: "Email already registered!",
      });
    }

    // creating new user
    const user = new User({
      name,
      username,
      email,
      password,
    });
    // email Verify token
    const emailToken = jwt.generateEmailVerificationToken({
      userId: user._id,
      email: user.email,
    });

    user.verificationToken = emailToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.save();

    //send verification email

    await emailService.sendVerificationEmail(email, name, emailToken);

    return res.status(200).json({
      success: true,
      message: "Registration Success",
    });
  } catch (error) {
    removeCookies(res);
    return res.status(500).json({
      success: false,
      message: "Failed to register",
    });
  }
};

export const login = async (req, res) => {
  try {
    const body = req.body;
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error.message,
      });
    }
    const { email, password } = result.data;
    // console.log(email);
    // console.log(password);
    const user = await User.findOne({ email }).select("+password");
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    // if (!user.isEmailVerified) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Please verify your email first",
    //   });
    // }
    // generate tokens
    
    const accessToken = jwt.generateAccessToken({
      userId: user._id,
      email: user.email,
    });
    const refreshToken = jwt.generateRefreshToken({
      userId: user._id,
      email: user.email,
    });
    
    user.refreshToken.push({
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    
    // console.log(user)
    //removing old refresh tokens
    user.refreshToken = user.refreshToken.filter(
      (token) => token.expiresAt > Date.now()
    );

    await user.save();
    setCookies(res, accessToken, refreshToken);
    return res.status(200).json({
      success: true,
      message: "Login Success",
      data: {
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
        },
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    removeCookies(res);
    return res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      res.status(400).json({
        success: false,
        message: "Verification Token is required",
      });
    }

    const checkedToken = jwt.verifyEmailToken(token);

    if (!checkedToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
    const user = await User.findById(checkedToken.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    if (
      user.verificationToken !== token ||
      user.verificationTokenExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    //verify email
    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    await emailService.sendWelcomeEmail(user.email, user.name);
    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify email. Please try again later.",
    });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // generate new Token for verification
    const emailToken = jwt.generateEmailVerificationToken({
      userId: user._id,
      email: user.email,
    });

    user.verificationToken = emailToken;
    user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    //send verification email
    await emailService.sendVerificationEmail(user.email, user.name, emailToken);
    res.status(200).json({
      success: true,
      message: "Verification email sent successfully",
    });

  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send verification email. Please try again.",
    });
  }
};


export const refreshToken = async(req,res)=>{
    try{
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        const decoded = jwt.verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token",
            });
        }
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // Check if the refresh token exists in the user's tokens
        const tokenExists = user.refreshToken.some(
            (token) => token.token === refreshToken && token.expiresAt > new Date()
        );
        if (!tokenExists) {
            return res.status(401).json({
                success: false,
                message: "Refresh token not found or expired",
            });
        }
        // Generate new tokens
        const newAccessToken = jwt.generateAccessToken({
            userId: user._id,
            email: user.email,
        });
        const newRefreshToken = jwt.generateRefreshToken({
            userId: user._id,
            email: user.email,
        });

        user.refreshToken = user.refreshToken.filter(e => e.token !== refreshToken);
        user.refreshToken.push({
            token: newRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        await user.save();
        setCookies(res, newAccessToken, newRefreshToken);
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            tokens: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
            },
        });
    }catch(error){
    
        res.status(500).json({
            success: false,
            message: "Failed to refresh token",
        });
    }
}

export const forgotPassword = async (req, res) => {
    try {
        const body = req.body;
        console.log(body)
        const result = forgotPasswordSchema.safeParse(body);
        console.log(result)
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.error.message,
            });
        }
        const { email } = result.data;
        const user = await User.findOne({ email});
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        // creating reset pass token\
        const resetToken = jwt.generatePasswordResetToken({
            userId: user._id,
            email: user.email,
        });
        user.resetPasswordToken = resetToken;
        user.resetPasswordTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();

        //send reset pass mail
        await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
        res.status(200).json({
            success: true,
            message: "Reset password email sent successfully",
        });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send reset password email. Please try again.",
        });
    }
}

export const resetPassword = async (req, res) => {
    try {
        const body = req.body;
        const result = resetPasswordSchema.safeParse(body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.error.message,
            });
        }
        const { token, newPassword } = result.data;

        const decoded = jwt.verifyResetPasswordToken(token);
        if (!decoded) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset password token",
            });
        }

        const user = await User.findById(decoded.userId);
        if (!user || user.resetPasswordToken !== token || user.resetPasswordTokenExpires < new Date()) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset password token",
            });
        }

        // Update password
        user.password = newPassword;
        user.resetPasswordToken = null;
        user.resetPasswordTokenExpires = null;

        //clearing refresh tokens for security
        user.refreshToken = [];

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reset password. Please try again.",
        });
    }
}

export const changePassword = async (req, res) => {
    try {
        const body = req.body;
        const result = changePasswordSchema.safeParse(body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.error.message,
            });
        }
        const { currentPassword, newPassword } = result.data;

        const user = await User.findById(req.user._id).select("+password");
        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        // Update password
        user.password = newPassword;

        // clear all tokens except the current refresh token
        const currRefreshToken = req.cookies.refreshToken;
        user.refreshToken = user.refreshToken.filter(e => e.token !== currRefreshToken)

        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to change password. Please try again.",
        });
    }
}

export const logout = async(req, res)=>{
    try{
        const refreshToken = req.cookies.refreshToken ;
        const userId = req.user?.id;
        if (refreshToken && userId) {
            await User.findByIdAndUpdate(userId ,{
                $pull: { refreshToken: { token: refreshToken } }
            })
        }
        removeCookies(res);
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });

    }catch (error) {
        console.error("Logout error:", error);
        removeCookies(res);
        res.status(500).json({
            success: false,
            message: "Failed to logout. Please try again.",
        });
    }
}