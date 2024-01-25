import createError from "http-errors";

const asyncHandler = (requestHandlerFun) => {
    return (req, res, next) => {
        Promise.resolve(requestHandlerFun(req, res, next)).catch((err) => {
          console.log(err);
            if(err.status){
            next(err);
           }
           next(createError.InternalServerError(err.message));
        })
    }
}

export { asyncHandler }