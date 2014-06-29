var common = require('./common.js');
var LIBRARY_VERSION = '1.0.0';
	
function millis(){
   return (1000*process.uptime());
}

/*Constructor (...)*********************************************************
 *    The parameters specified here are those for for which we can't set up 
 *    reliable defaults, so we need to have the user set them.
 ***************************************************************************/
var PID = function( Input, Output, Setpoint, Kp, Ki, Kd, ControllerDirection) {

    this.Output = Output;
    this.Input = Input;
    this.SetSetPoint(Setpoint);

    this.inAuto = false;

    this.Initialize();
    this.SetOutputLimits(0, 1);				//default output limit corresponds to 
								//the beaglebone black duty cycles pwm limits

    SampleTime = 5000;						//default Controller Sample Time is 0.1 seconds

    this.SetControllerDirection(ControllerDirection);
    this.SetTunings(Kp, Ki, Kd);

    this.lastTime = millis()-SampleTime;				
}

/* Compute() **********************************************************************
 *     This, as they say, is where the magic happens.  this function should be called
 *   every time "void loop()" executes.  the function will decide for itself whether a new
 *   pid Output needs to be computed.  returns true when the output is computed,
 *   false when nothing has been done.
 **********************************************************************************/ 
PID.prototype.Compute = function(Input)
{
   this.Input = Input;
   /*Compute all the working error variables*/
   input = Input;
   error = this.Setpoint - input;
   this.ITerm+= (this.ki * error);
   if(this.ITerm > this.OutMax) this.ITerm= this.OutMax;
   else if(this.ITerm < this.outMin) this.ITerm= this.outMin;
   dInput = (input - lastInput);

   /*Compute PID Output*/
   output = this.kp * error + this.ITerm- this.kd * dInput;
      
   if(output > this.OutMax) output = this.OutMax;
   else if(output < this.outMin) output = this.outMin;
   this.Output = output;
	  
   /*Remember some variables for next time*/
   lastInput = input;
   return output;
};

/* SetTunings(...)*************************************************************
 * This function allows the controller's dynamic performance to be adjusted. 
 * it's called automatically from the constructor, but tunings can also
 * be adjusted on the fly during normal operation
 ******************************************************************************/ 
PID.prototype.SetTunings = function(Kp, Ki, Kd)
{
   if (Kp<0 || Ki<0 || Kd<0) return;
 
   this.Kp = Kp; this.Ki = Ki; this.Kd = Kd;
   
   SampleTimeInSec = SampleTime/1000;  
   this.kp = this.Kp;
   this.ki = this.Ki * SampleTimeInSec;
   this.kd = this.Kd / SampleTimeInSec;
 
  if(this.controllerDirection == common.REVERSE)
   {
      this.kp = (0 - this.kp);
      this.ki = (0 - this.ki);
      this.kd = (0 - this.kd);
   }
};

/* SetSampleTime(...) *********************************************************
 * sets the period, in Milliseconds, at which the calculation is performed	
 ******************************************************************************/
PID.prototype.SetSampleTime = function(NewSampleTime)
{
   if (NewSampleTime > 0)
   {
      ratio  = NewSampleTime / SampleTime;
      ki *= ratio;
      kd /= ratio;
      SampleTime = NewSampleTime;
   }
};
 
/* SetOutputLimits(...)****************************************************
 *     This function will be used far more often than SetInputLimits.  while
 *  the input to the controller will generally be in the 0-1023 range (which is
 *  the default already,)  the output will be a little different.  maybe they'll
 *  be doing a time window and will need 0-8000 or something.  or maybe they'll
 *  want to clamp it from 0-125.  who knows.  at any rate, that can all be done
 *  here.
 **************************************************************************/
PID.prototype.SetOutputLimits = function(Min, Max)
{
   if(Min >= Max) return;
   this.outMin = Min;
   this.OutMax = Max;
 
   if(this.inAuto)
   {
	   if(Output > this.OutMax) Output = this.OutMax;
	   else if(Output < this.outMin) Output = this.outMin;
	 
	   if(this.ITerm > this.OutMax) this.ITerm= this.OutMax;
	   else if(this.ITerm < this.outMin) this.ITerm= this.outMin;
   }
};

/* SetMode(...)****************************************************************
 * Allows the controller Mode to be set to manual (0) or Automatic (non-zero)
 * when the transition from manual to auto occurs, the controller is
 * automatically initialized
 ******************************************************************************/ 
PID.prototype.SetMode = function(Mode)
{
    newAuto = (Mode == common.AUTOMATIC);
    if(newAuto == !this.inAuto)
    {  /*we just went from manual to auto*/
        this.Initialize();
    }
    this.inAuto = newAuto;
};
 
/* Initialize()****************************************************************
 *	does all the things that need to happen to ensure a bumpless transfer
 *  from manual to automatic mode.
 ******************************************************************************/ 
PID.prototype.Initialize = function()
{
   this.ITerm = this.Output;
   lastInput = this.Input;
   if(this.ITerm > this.OutMax) this.ITerm = this.OutMax;
   else if(this.ITerm < this.outMin) this.ITerm = this.outMin;
};

/* SetControllerDirection(...)*************************************************
 * The PID will either be connected to a DIRECT acting process (+Output leads 
 * to +Input) or a REVERSE acting process(+Output leads to -Input.)  we need to
 * know which one, because otherwise we may increase the output when we should
 * be decreasing.  This is called from the constructor.
 ******************************************************************************/
PID.prototype.SetControllerDirection = function(Direction){
   if(this.inAuto && Direction != this.controllerDirection)
   {
      this.kp = (0 - this.kp);
      this.ki = (0 - this.ki);
      this.kd = (0 - this.kd);
   }   
   this.controllerDirection = Direction;
};

PID.prototype.SetSetPoint = function(Setpoint) {
    this.Setpoint = Setpoint;
}

/* Status Funcions*************************************************************
 * Just because you set the Kp=-1 doesn't mean it actually happened.  these
 * functions query the internal state of the PID.  they're here for display 
 * purposes.  this are the functions the PID Front-end uses for example
 ******************************************************************************/
PID.prototype.GetKp = function(){ return this.Kp; };
PID.prototype.GetKi = function(){ return this.Ki; };
PID.prototype.GetKd = function(){ return this.Kd; };
PID.prototype.GetOutput = function(){ return this.Output; };
PID.prototype.GetMode = function(){ return this.inAuto ? common.AUTOMATIC : common.MANUAL; };
PID.prototype.GetDirection = function(){ return this.controllerDirection; };
PID.prototype.GetSetPoint = function(){ return this.Setpoint; };
PID.prototype.GetSampleTime = function(){ return SampleTime; };

module.exports = PID;
