import { z } from 'zod';

export const signUpSchema = z.object({
    name: z.string().trim().min(3),
    username:z.string().trim(),
    email:z.string().email(),
    password:z.string().min(8),
    confirmPassword:z.string(),


}).refine((e) => e.password === e.confirmPassword , {
    message:"Passwords Dont match",
    path:['confirmPassword']
} ) 

export const loginSchema = z.object({
    email:z.string().email(),
    password:z.string()
})

export const forgotPasswordSchema = z.object({
    email: z.string().email()
})

export const resetPasswordSchema = z.object({
    token:z.string(),
    newPassword:z.string().min(6)
})

export const changePasswordSchema = z.object({
    currentPassword : z.string(),
    newPassword: z.string().min(6)
})