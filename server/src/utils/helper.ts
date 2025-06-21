export const generateOTP : () => string = () => {
    let numbers = '1234567890'
    let otp = ''
    for (let i = 0; i <= 6; i++) {
        otp += numbers[Math.floor(Math.random() * numbers.length)]
    }
    return otp
}