/* main.js for Modbus data file testing */

	function decodeInteger ( number ) {
		let integ = Number(number.toString(16));
		let val = integ; /* All 16 bits */

		return val.toString();
	};

	function decodeInteger8 ( number ) {
		/* Seems to return correct values, but allows values up to 255.
		   I think it might be better to not force to range 0 to 99, at least now.

		   Value 806 has high byte 3 and low byte 38
		   Value 829 has high byte 3 and low byte 61
		*/

		let integ = Number(number.toString(16));
		let val = integ & 0xff; /* Only 8 bits */

		return val.toString();
	};

	function decodeLong ( highWord, lowWord ) {
		/* LONG integer (negative or positive) to be combined from two 16 bit integers
		   Range -2147483648 to 2147483647.
		*/
		let integHigh = Number(highWord.toString(16));
		let integLow  = Number( lowWord.toString(16));
		let val = integHigh * 0x10000 + integLow; /* All 32 bits */

		let sign = integHigh & 0x8000 ? -1 : 1; /* Negative sign is left bit */
		if ( sign === -1 ) {
			/* Two's complement for negative values */
			val = ((~val) +1) * sign;
		}

		return val.toString();
	};

	function decodeReal4 ( Word1, Word2 ) {
		/* Format REAL4 (negative or positive) to be combined from two 16 bit integers.
		   Result seems to be almost same as example value. Mantissa is only 23 bits.
		   That gives about 7 significant digits. Example value has rather many digits.
		   Might be differences of javascript. Or something else.
		*/
		let integHigh = Number(Word1.toString(16));
		let integLow  = Number(Word2.toString(16));
		let val = integHigh * 0x10000 + integLow;

		let sign = val & 0x80000000 ? -1 : 1; /* Negative sign is left bit */
		let exp  = ((val >> 23) & 0xff) - 0x7f; /* Exponent */
		let mantissa = 1 + (val & 0x7fffff) / 0x7fffff; /* Mantissa */
		let result = sign * mantissa * Math.pow(2, exp);

		return result.toString();
	};


	function decodeModbus(text) {
		/* Check modbus data file and show more human friendly numbers */

		const register = 1;
		const value = 2;
		let myTitle = "Modbus data report";

		document.write( "<head>" );
		document.write( "<meta http-equiv=\"content-type\" content=\"text/html; charset=windows-1252\"/>" );

		document.write( "<style type=\"text/css\">" );
		document.write( "body,div,table,thead,tbody,tfoot,tr,th,td,p { " );
		document.write( "font-family:\"Liberation Sans\"; font-size:x-small }" );
		document.write( "</style>" );

		document.write( "</head>" );

		document.write( "<title>"+myTitle+"</title>" );
		document.write( "<h2>"+myTitle+"</h2>" );
		document.write( "<br>" );

		document.write( "Date " );
		document.write( text.substring(0,16) );
		document.write( "<br><br>" );

		document.write( "<table cellspacing=\"\" border=\"1\">" );
		document.write( "<colgroup width=\"100\"></colgroup>" );
		document.write( "<colgroup width=\"300\"></colgroup>" );
		document.write( "<colgroup width=\"100\"></colgroup>" );

		document.write( "<tr>" );
		document.write( "<td height=\"21\" align=\"left\"><b>Register</b></td>" );
		document.write( "<td align=\"left\"><b>Description</b></td>" );
		document.write( "<td align=\"right\"><b>Value</b></td>" );
		document.write( "</tr>" );

		/* Currently only implemented NUMBER of registers 1 and 2. Now 3 or more not supported. */
		let counter = 0;
		let number = 2;
		let format = "REAL4";
		let simpleDescr = " ";

		let previousVal = 0;
		let previousReg = 0;

		let currentVal  = 0;
		let currentReg  = 0;

		let result = 0;
		let range = " ";

		let state = 0;
		let data = "";
		let idx = 0;
		for ( idx=17 ; idx < text.length ; idx++ )
		{
			single = text[idx];
			if ( single === " " ) { /* This might not be any problem, but not implemented */
				alert("Space found!");
			}

			switch( single ) {
 			  case "\n":
			    	/* Next is register number, save collected value data */
				state = register;

				previousVal = currentVal;
				currentVal  = data;

				data = "";

				/* At this time defaulting to REAL4 with 2 registers.
				   There seems to be some BCD, but those are shown as single integers.
				   LONG are 10,14,18,22,26,30
				   INTEGER are 59-62 (62 twice), 92-96 (63-71,73-76,91 not documented) (72 BIT) 
				   (92 showing only 8 bits. But also high byte is used, but not shown.)
				   This part should be replaced with some data file, not implemented.
				*/
				format = "REAL4";
				number = 2;
				range = " ";
				counter++;

				if (currentReg === "10" || currentReg === "14" || currentReg === "18" ||
				    currentReg === "22" || currentReg === "26" || currentReg === "30" ) {
					format = "LONG";
					counter = number;
				}
				if ( (Number(currentReg) >= "59" && Number(currentReg) <= "76") || 
				     (Number(currentReg) >= "91" && Number(currentReg) <= "96") ) {
					format = "INTEGER";
					number = 1;
				}
				if ( currentReg === "92" ) { // This is minor exception for the INTEGER
					format = "INTEGER8"; // For this only low byte is shown currently.
					number = 1;
				}
				if (  Number(currentReg) >= "49" && Number(currentReg) <= "58" ) {
					format = "BCD";
					number = 1;
				}
				if ( currentReg === "72" ) { // BIT not implemented
					format = "BIT";
				}

				/* Row data collected */
				if ( counter == number ) {
					/* Combine 2 registers or only with one */
					if ( number == 2 ) {
						if (format === "REAL4") {
							result = decodeReal4 (currentVal, previousVal);
						}
						if (format === "LONG") {
							result = decodeLong (currentVal, previousVal);
						}
						range = previousReg+"-"+currentReg;
					} else {
						if (format === "INTEGER") {
							result = decodeInteger (currentVal);
						}
						if (format === "INTEGER8") { // Only register 92
							result = decodeInteger8 (currentVal);
							//alert(currentVal);
						}
						if (format === "BCD" || format === "BIT") { 
							// Not implemented. Some seem not to be documented.
							result = "'"+decodeInteger (currentVal)+"'";
						}
						range = currentReg;
					}
					counter = 0;

					simpleDescr = "description of "+format+" register "+range; /* Generic description now. */

					/* Example of description. Should have some file for details of registers. */
					if ( currentReg === "2" ) {  
						simpleDescr = "Flow Rate"
					}
					if ( currentReg === "4" ) {  
						simpleDescr = "Energy Flow Rate"
					}
					if ( currentReg === "22" ) {  
						simpleDescr = "Negative energy accumulator"
					}
					if ( currentReg === "34" ) {  
						simpleDescr = "Temperature #1/inlet"
					} 
					if ( currentReg === "92" ) { 
						simpleDescr = "Signal Quality"
					}

					/* Table row with the information */
					document.write( "<tr>" );
					document.write( "<td height=\"21\" align=\"left\">"+range+"</td>" );
					document.write( "<td align=\"left\">"+simpleDescr+"</td>" );
					document.write( "<td align=\"right\">"+result+"</td>" );
					document.write( "</tr>" );

				} /* End of - if counter up to number of registers */

      			    break;
			  case ":":
    				// Next is value, save collected register number
				state = value;

				previousReg = currentReg;
				currentReg  = data;

				//alert(data);
				data = "";

				if ( currentReg === "1" ) {
					//alert(counter);
					counter = 0;
				}

			    break;
			  default:
			    	// Number is register or value
				data = data + single;

			} // switch

		} // for

		document.write( "</td>" );
		document.write( "</table>" );

	} // decodeModbus

/* End of main.js */
