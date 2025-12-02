export const asyncHandler = (fn)=>{ 
    return async (req,res,next)=>{
    try {
        await fn(req,res,next);
    } catch (error) {
        res.status(error.code||500).json({
            success: false,
            message: error.message || "Something went wrong"
        })
    }
}}





























//// #### FOR MY UNDERSTANDING

// const asyncHand = (func)=>{
//     return async ()=>{
//         try {
//           return await func()
//     } catch (error) {
//         console.log(error.message);
        
//     }}}
    
// const newFunc = asyncHand(async()=>{
//     const a = 5
//     const b = 2

//     console.log(a+b)
// })



// export const asyncHandler = (func)=>{
//     return(res,req,next)=>{
//         Promise.resolve(func(res,req,next)).catch((err)=> next(err))
//     }
// }