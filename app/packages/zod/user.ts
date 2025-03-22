import zod from 'zod'

export const signUpType = zod.object({
    email : zod.string().email(),
    password : zod.string().min(6)
})