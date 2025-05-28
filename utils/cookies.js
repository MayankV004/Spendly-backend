const cookieOptions = {
    httOnly:true,
    secure:process.env.NODE_ENV === 'production',
    sameSite:process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path:'/'
}

export const setCookies = (res , accessToken , refreshToken)=>{
    res.cookie('accessToken',accessToken,{
        ...cookieOptions,
        maxAge:15 * 60 * 1000 // 15 min
    });
    res.cookie('refreshToken',refreshToken,{
        ...cookieOptions,
        maxAge:7 * 24 * 60 * 1000 // 7 days
    });
}

export const removeCookies = (res)=>{
    res.clearCookie('accessToken',cookieOptions);
    res.clearCookie('refreshToken',cookieOptions);
}