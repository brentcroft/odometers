/**
    calculate the values (as BigNumbers) of the polynomials formed by
    by the terminal coordinate.
*/
function terminalPolynomials( order, bases ) {
    const C = [];

        bases.forEach( base => {
            const coefficients = new Array(order).fill( base - 1 );
            var accumulate = BigNumber(0);
            var placePower = BigNumber(1);
            coefficients.forEach( coefficient => {
                accumulate = accumulate.plus( placePower.multipliedBy( coefficient ) );
                placePower = placePower.multipliedBy( base );
            } );
            C.push( accumulate );
        } );
    return C;
}

function cyclePolynomials( cycles, cycle ) {
    const equations  = [];
    const bases = [...cycles.box.odometer.bases];
    const dimension = bases.length;
    const order = cycles.order();
    const cyclesParity = cycles.parity();
    const terminal = BigNumber(cycles.box.volume - 1);

    bases.forEach( (base, baseIndex) => {

        const fixedFactor = cycles.C()[baseIndex];
        const cIsInt = fixedFactor.isInteger();

        // the coefficients formed by picking a place from each underlying point
        const cycleCoefficients = cycle.map( id => cycles.box[ id ][baseIndex] );
        if (cycleCoefficients) {

            const factor = BigNumber(cycle[cyclesParity[0] == 0 ? (cycle.length - 1) : 0]);

            if ((baseIndex % 2) == cyclesParity[0]) {
                cycleCoefficients.reverse();
            }

            const coefficients = [];
            const repeats = order / cycle.length;
            for (var i = 0; i < repeats; i++) {
                coefficients.push(...cycleCoefficients);
            }
            var accumulate = BigNumber(0);
            var placePower = BigNumber(1);
            var error = 'uf';

            try {
                coefficients.forEach( coefficient => {
                    accumulate = accumulate.plus( placePower.multipliedBy( coefficient ) );
                    placePower = placePower.multipliedBy( base );
                } );

                if ( fixedFactor > 0 && fixedFactor.isInteger() ) {
                    const adff = accumulate.dividedBy( fixedFactor );
                    if ( adff.isInteger() ) {
                        adffdf = adff.dividedBy( factor );
                        if (adffdf == 1) {
                            error = null;
                        } else {
                            error = 'fixedFactor';
                        }
                    } else {
                        const adf = accumulate.dividedBy( factor );
                        if ( adf.isInteger() ) {
                            error = 'factor';
                        }
                    }

                }
            } catch (e) {
                console.log(e);
                error = e.message;
            }

            const reverseCoefficients = true;
            if (reverseCoefficients) {
                coefficients.reverse();
            }

            equations.push( {
                'acc': accumulate,
                'base': base,
                'coeffs': coefficients,
                'factor': factor,
                'fixedFactor': fixedFactor,
                'error': error,
                'terminal': terminal } );
        } else {
            console.log( `No cycle coordinates: ${ this }` );
        }
    } );

    return equations;
}
