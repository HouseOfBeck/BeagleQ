from array import array

eepromFile='/sys/bus/i2c/drivers/at24/1-0054/eeprom'

eeprom = open(eepromFile, 'wb')
out_array = array('l', [9950,9950,9980,9950])
eeprom.seek(244)
out_array.tofile(eeprom)
eeprom.close()

eeprom = open(eepromFile, 'rb')
eeprom.seek(244)
in_array = array('l')
in_array.fromfile(eeprom,4)
eeprom.close()
print in_array
