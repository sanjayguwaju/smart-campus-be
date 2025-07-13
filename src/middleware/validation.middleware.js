import { validationResult } from "express-validator";

const validateRequest =(res,req,next)=>{
    const error =validationResult(req);
    if(!error.isEmpty()){
        return res.status(400).json({
            sucess:failed,
            message: "validation Error",
            errors:error.array()
        })
    }
    next();
}
export { validateRequest };