class ApiError extends Error{
  constructor(
    statusCode,
    message="something went wrong",
    errors=[],
    stack=""

  ){
    //constructor me override kr rhe super call kra
    super(message)
    this.statusCode=statusCode
    this.data=null
    this.message=message
    this.success=false;
    this.errors=errors

    if(stack){
        this.stack=stack

    }else{
        Error.captureStackTrace(this,this.constructor)
    }
  }
}
export  {ApiError}