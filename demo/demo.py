import Adafruit_BBIO.ADC as ADC
import Adafruit_BBIO.PWM as PWM
from array import array
import struct
import time

print "\nReading calibration data from eeprom ... \n"

eeprom = open('/sys/bus/i2c/drivers/at24/1-0054/eeprom', 'rb')
eeprom.seek(244)
in_array = array('l')
in_array.fromfile(eeprom,4)
eeprom.close()

for i in range(4):
	print in_array[i]

ADC.setup()
       
print "\nReading ADC pins ...\n"
print "P9_39 P9_37 P9_35 P9_33\n"

for i in range(10):
	raw1 = ADC.read_raw('P9_39')
	raw2 = ADC.read_raw('P9_37')
	raw3 = ADC.read_raw('P9_35')
	raw4 = ADC.read_raw('P9_33')
	print raw1, raw2, raw3, raw4
	time.sleep(1)
     

print
print "Setting up PWM 4kHz on P9_16...buzzer test"
pwm_pin = 'P8_19'
PWM.start(pwm_pin, 25, 4000)

PWM.set_duty_cycle(pwm_pin, 50)
time.sleep(2)

PWM.set_duty_cycle(pwm_pin, 0)

print "Tearing down...",
PWM.stop(pwm_pin)

PWM.cleanup()
print "Done...buzzer test"

pwm_pin = 'P9_16'

print "Setting up PWM..."
print "Fan...100% duty cycle"
PWM.start(pwm_pin, 100, 20000)

time.sleep(6)

print "Fan...75% duty cycle"
PWM.set_duty_cycle(pwm_pin, 75)
time.sleep(6)

print "Stopping..."
PWM.set_duty_cycle(pwm_pin, 0)

print "Tearing down..."
PWM.stop(pwm_pin)

PWM.cleanup()
print "Done"
