
function cycles( source ) {
    const ri = [...source.index];
    const cycles = new Cycles();
    cycles.key = source.key;
    cycles.name = source.name;
    cycles.permPair = source.sources;
    cycles.box = source.box;
    //cycles.parity = source.parity;
    for ( var i = 0; i < ri.length; i++ ) {
        const startId = i;
        var nextId = ri[startId];
        if (nextId < 0) {
            continue;
        }
        const cycle = new Cycle();
        cycle.push( startId );
        ri[startId] = -1;
        while ( nextId != startId ) {
            cycle.push( nextId );
            const lastId = nextId;
            nextId = ri[ lastId ];
            if (nextId < 0) {
                throw new Error( `Index does not contain next id: ${ lastId }` );
            } else {
                ri[lastId] = -1;
            }
        }
        cycle.stats = {};
        cycles.push( cycle );
    };
    cycles.index = [...source.index];
    cycles.canonicalize();
    return cycles;
}


function inverse( source ) {
    const key = `${ source.key }^-1`;
    const idx = source.index;
    const index = new Array( idx.length );
    for ( var i = 0; i < idx.length; i++ ) {
        index[i] = idx.indexOf(i);
    }
    return cycles( {
        'index': index,
        'key': key,
        'box': source.box
    } );
}

function collapseBrokenCycleInIndex( c, index ) {
    const items = [ c ];
    var x = index.indexOf( c );
    while (x >= 0) {
        if (x == c) {
            console.log(`Not a broken cycle: ${ items }`);
            return;
        }
        items.push( x );
        x = index.indexOf( x );
    }
    items.forEach( i => index[i] = i);
}

function sanitiseCycles(index) {
    const l = index.length;
    for (var i = 0; i < l; i++ ) {
        if (index[i] >= l ) {
            collapseBrokenCycleInIndex(i, index);
        }
    }
}

function compose( leftSource, rightSource, twist = false, box ) {
    const ri = rightSource.index;
    const li = leftSource.index;
    const key = `${ maybeBracket( leftSource.key ) }${ twist ? ':' : '*' }${ maybeBracket( rightSource.key ) }`;
    const l = ri.length;
    if (l != li.length) {
        throw new Error(`Cannot compose indexes of different lengths: ${ key }`);
    }
    const index = new Array( ri.length );
    for ( var i = 0; i < ri.length; i++ ) {
        var nextId = twist ? ri.indexOf(i) : ri[i];
        index[i] = li[nextId] % ri.length;
    }
    return cycles( { 'index': index, 'key': key, 'box': box } );
}

function product( leftSource, rightSource, twist = false, box ) {
    const ri = rightSource.index;
    const li = leftSource.index;
    const index = [];
    for ( var i = 0; i < ri.length; i++ ) {
        const nextOffset = twist
            ? ri.indexOf(i) * li.length
            : ri[i] * li.length;
        const x = li.map( j => j + nextOffset );
        index.push( ...x );
    };
    return cycles( {
        'index': index ,
        'key': `${ maybeBracket( leftSource.key ) }${ twist ? '~' : '|' }${ maybeBracket( rightSource.key ) }`,
        'box': box
    } );
}

function reduce( leftSource, rightSource, twist = false, box ) {
    const ri = rightSource.index;
    const li = leftSource.index;
    const l = li.length / ri.length;
    const key = `${ maybeBracket( leftSource.key ) }${ twist ? '/' : '/' }${ maybeBracket( rightSource.key ) }`;
    if (!Number.isInteger(l)) {
        throw new Error(`Cannot divide index of size ${li.length} by ${ ri.length }; calculating ${ key }`);
    }
    const indexes = [];
    for ( var i = 0; i < ri.length; i++ ) {
        const nextOffset = (i * l);
        const x = li.slice(nextOffset, l + nextOffset).map( v => v % l );
        if ( !indexes.find( a => arrayExactlyEquals(a,x) ) ) {
            indexes.push( x );
        }
    }
    if (indexes.length != 1 ) {
        throw new Error(`Different parts returned from division; calculating ${ key }\n${ indexes.map( (idx,i) => i + ': [' + idx + ']' ).join('\n') }`);
    }
    return cycles( {
        'index': indexes[0],
        'key': key,
        'box': Box.of( [ l ] )
    } );
}

function truncate( leftSource, rightSource, twist = false, box ) {
    const ri = rightSource.index;
    const l = ri.length;
    const li = leftSource.index.slice(0, l);
    for (var i = 0; i < l; i++ ) {
        if (li[i] >= l ) {
            collapseBrokenCycleInIndex(i, li);
        }
    }
    return cycles( {
        'index': li ,
        'key': `${ maybeBracket( leftSource.key ) }${ twist ? '%' : '%' }${ maybeBracket( rightSource.key ) }`,
        'box': Box.of( [ l ] )
    } );
}


class Cycle extends Array {

    constructor() {
        super( arguments.length > 0 && Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
    }

    indexOfCoord( coord ) {
        for ( var i = 0; i < this.length; i++ ) {
            if ( arrayExactlyEquals( this[i], coord ) ) {
                return i;
            }
        }
        return -1;
    }

    previous( i ) {
        return this[ ( i + this.length - 1 ) % this.length ];
    }

    next( i ) {
        return this[ ( i + 1 ) % this.length ];
    }

    getStats( points ) {
        if ( Object.hasOwn( this, '$stats' ) ) {
            return this.$stats;
        }
        const rank = points[0].length;

        const order = this.length;
        const centre = new Array( rank ).fill( 0 );
        const coordsSum = new Array( rank ).fill( 0 );

        this
            .map( index => points[index] )
            .filter( coord => coord )
            .forEach( coord => coord.forEach( (c,i) => coordsSum[i] += c ) );

        centre
            .forEach( ( s, i ) => {
                centre[i] = s / order;
            } );

        const indexPerimeter = this
            .map( (index,i) => this[ ( i + 1 ) % order ] - index )
            .map( jump => Math.abs( jump ) )
            .reduce( (a,c) => a + c, 0 );

        const euclideanPerimeter = this
            .map( (index,i) => distance2( points[index], points[ this[ ( i + 1 ) % order ] ] ) )
            .reduce( (a,c) => a + c, 0 );

        const idSum = this.reduce( (a,index) => a + index, 0 );

        this.$stats = {
            order: order,
            centre: centre,
            idSum: idSum,
            coordsSum: coordsSum,
            gcd: coordsSum.reduce( gcd ),
            lcm: coordsSum.reduce( lcm ),
            indexPerimeter: indexPerimeter,
            euclideanPerimeter: euclideanPerimeter
        };
        return this.$stats;
    }

    equations( cycles ) {
        const equations  = [];
        const bases = [...cycles.box.odometer.bases];
        const dimension = bases.length;
        const order = cycles.order();
        const cyclesParity = cycles.parity();
        const terminal = BigInt(cycles.box.volume - 1);

        bases.forEach( (base, bI) => {

            const baseIndex = bI;//(bases.length -1 - bI);

            const fixedFactor = cycles.C()[baseIndex];
            const cIsInt = true;

            // the coefficients formed by picking a place from each underlying point
            const cycleCoefficients = this.map( id => cycles.box[ id ][baseIndex] );
            if (cycleCoefficients) {

                const factor = BigInt(this[cyclesParity[0] == 0 ? (this.length - 1) : 0]);

                if ((baseIndex % 2) == cyclesParity[0]) {
                    cycleCoefficients.reverse();
                }

                const coefficients = [];
                const repeats = order / this.length;
                for (var i = 0; i < repeats; i++) {
                    coefficients.push(...cycleCoefficients);
                }
                var acc = BigInt(0);
                var placeValue = BigInt(1);
                var error = null;

                try {
                    coefficients.forEach( (coefficient, place) => {
                        acc = acc + BigInt(coefficient) * placeValue;
                        if (acc > MAX_SAFE_INT) {
                            throw new Error( 'Exceeded MAX_SAFE_INT' );
                        }
                        placeValue = placeValue * BigInt(base);
                    } );

                    if (dimension == 1 && fixedFactor > 0) {
                        error = (acc / fixedFactor);
                        error = (error / factor);
                        if (error == 1) {
                            error = null;
                        }
                    } else if ( cIsInt && fixedFactor > 0) {
                        error = (acc / fixedFactor);
                        error = (error / factor);
                        if (error == 1) {
                            error = null;
                        }
                    } else {
                        error = 'uf';
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
                    'acc': acc,
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
    htmlEquations( cycles ) {
        return reify(
            "span",
            { 'class': 'equation' },
            this.equations( cycles )
                .flatMap( (
                    {
                        'acc': acc,
                        'base': base,
                        'coeffs': coeffs,
                        'factor': factor,
                        'fixedFactor': fixedFactor,
                        'error': error,
                        'terminal': terminal
                    } ) => [
                    ...coeffs.flatMap( (c,i) => [
                        reify( "b", {}, [ base > 10 ? reifyText( '&emsp14;' ) : null, reifyText( `${ c }` ) ] ),
                    ] ),
                    reify( "sub", {}, [ reifyText( `${ base }` ) ] ),
                    reify( "b", {}, [ reifyText( ` = ${ acc } ` ) ] ),
                    reify( "i", {}, [
                        error
                            ? reify( "span", { 'class': 'mgEqn' }, [ reifyText( `(${ terminal } x ${ acc / terminal })` ) ] )
                            : reifyText( ` (${ factor } x ${ fixedFactor })` ),
                    ] ),
                    reify( "br" )
                ] ) );
    }
}

class Cycles extends Array {

    constructor() {
        super( arguments.length > 0 && Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
        this.key = "";
    }

    static fromSource( source ) {
        return cycles( source );
    }

    canonicalize() {
        function ios( cycle ) {
            var l = 0;
            for (var i = 1; i < cycle.length; i++) {
                if ( cycle[ i ] < cycle[ l ] ) {
                    l = i;
                }
            }
            return l;
        }
        this.forEach( cycle => rotateArray( cycle, ios( cycle ) ) );
        const comparator = (a,b) => a.length == b.length ? a[0] - b[0] : a.length - b.length;
        this.sort( comparator );
    }

    identities() {
        return this.filter( cycle => cycle.length == 1);
    }

    orbits() {
        return this.filter( cycle => cycle.length != 1);
    }

    C() {
        if (!Object.hasOwn( this, '$C')) {
            const C = [];
            const order = this.order();
            const terminalCoords = this.getTerminal();
            const bases = this.box.odometer.bases;
            const factor = BigInt(this.box.length - 1);

            bases.forEach( (base, bI) => {

                const baseIndex = bI; //(bases.length -1 - bI);
                const terminalCoord = terminalCoords[baseIndex];
                const coeffs = [];
                for (var i = 0; i < order; i++) {
                    coeffs.push( terminalCoord );
                }
                var acc1 = BigInt(0);
                var basePower1 = BigInt(1);
                coeffs.forEach( (coeff, place) => {
                    acc1 = acc1 + (BigInt(coeff) * basePower1);
                    basePower1 = basePower1 * BigInt(base);
                } );
                C.push( acc1 / factor );
            } );
            this.$C = C;
        }
        return this.$C;
    }

    order() {
        if (!Object.hasOwn(this,'$order')) {
            this.$order = lcma( this.map( a => a.length ) );
        }
        return this.$order;
    }

    permPairLabel() {
        return "&lt;"
            + this.permPair[0].join('.')
            + "|"
            + this.permPair[1].join('.')
            + "&gt;";
    }

    label() {
        return this.key;
    }

    ref() {
        return this.name ? this.name : '';
    }

    perms() {
        try {
            return this.permPair
                .filter( p => Array.isArray(p) )
                .map( p => `[${ p.perm }]`).join(',');
        } catch ( e ) {
            return null;
        }
    }

    parity() {
        try {
            return this.permPair[0];
        } catch ( e ) {
            return [1];
        }
    }

    placeValuePair() {
        try {
            return "["
                + this.permPair[0].placeValues.join(',')
                + "]:["
                + this.permPair[1].placeValues.join(',')
                + "]";
        } catch ( e ) {
            return "";
        }
    }

    monomial() {
        const monomial  = {};
        this.forEach( cycle => monomial[cycle.length] = ( cycle.length in monomial )
            ? monomial[cycle.length] + 1
            : 1 );
        Object.entries( monomial ).sort( (a, b) => a < b );
        return monomial;
    }

    htmlMonomial() {
        return reify( "span", { 'class': 'monomial' }, Object
            .entries( this.monomial() )
            .flatMap( ( [ k, e ] ) => [
                reify( "i", {}, [ reifyText( k == 1 ? "(e" : "a" )  ] ),
                reify( "sup", {}, [ reifyText( `${ e }` ) ] ),
                k == 1
                    ? reifyText( ")" )
                    : reify( "sub", { 'style': 'position: relative; left: -.5em;'}, [ reifyText( `${ k }` ) ] )
            ] ) );
    }
    getRank() {
        return this.box.odometer.length;
    }
    getBases() {
        return this.box.odometer.bases;
    }
    getVolume() {
        return this.box.length;
    }
    getOrigin() {
        return this.box[0];
    }
    getTerminal() {
        return this.box[this.box.length - 1];
    }
    getDiagonal() {
        return [ this.getOrigin(), this.getTerminal() ];
    }
    getCentre() {
        return this.getTerminal().map( b => b / 2 );
//        return this.box.centre;
    }

    getStats() {
        if( Object.hasOwn( this, '$stats' ) ) {
            return this.$stats;
        }
        this.$stats = this
            .map( cycle => {
                try {
                    const stats = cycle.getStats(this.box);
                    return stats;
                } catch (e) {
                    console.log( `Error getting cycle stats: ${e}`);
                }
            } )
            .filter( stats => stats != null )
            .reduce( (a,c) => {
                a.idSum += c.idSum;
                a.coordsSum = addition( a.coordsSum, c.coordsSum );
                a.indexPerimeter += c.indexPerimeter;
                a.euclideanPerimeter += c.euclideanPerimeter;
                return a;
            },
            {
                idSum: 0,
                coordsSum: new Array(this.getRank()).fill(0),
                indexPerimeter: 0,
                euclideanPerimeter: 0
            } );
        return this.$stats;
    }

    getCentres() {
        if ( Object.hasOwn( this, '$centres' ) ) {
            return this.$centres;
        }

        const allowance = 0.00000000001;
        const boxCentre = this.getCentre();

        var centreLines = [
            { "points": this.getDiagonal(), "unit": unitDisplacement( ...this.getDiagonal() ), "pd": 0 }
        ];
        var centrePoints = [
            { "point": [0,0,0], "lineRef": 0, "hyp2": 0 }
        ];

        function assignCentreRef( cycleStats ) {
            const centreDist = distance2( centrePoints[0].point, cycleStats.centre );
            if ( centreDist < allowance ) {
                cycleStats.centreRef = 0;
                return;
            }
            for ( var i = 1; i < centrePoints.length; i++) {
                const d = distance2( centrePoints[i].point, cycleStats.centre );
                if ( d < allowance ) {
                    cycleStats.centreRef = i;
                    return;
                }
            }

            // new centre
            function getCentreLineRef( centre ) {
                var cpd = perpendicularDistance( centre, centreLines[0].points, centreLines[0].unit );
                if ( cpd < allowance ) {
                    return 0;
                }

                const unit = displacement( centre, centre );
                const scaledUnit = scale( unitDisplacement( centre, boxCentre ), 1 );

                for ( var i = 1; i < centreLines.length; i++) {
                    const pd = perpendicularDistance( centre, centreLines[i].points, centreLines[i].unit );
                    if ( pd < allowance ) {
                        if ( cpd > centreLines[i].pd ) {
                            centreLines[i].points = [
                                subtraction( subtraction( boxCentre, unit ), scaledUnit),
                                addition( addition( boxCentre, unit ), scaledUnit)
                            ];
                        }
                        return i;
                    }
                }

                const points = [
                    subtraction( subtraction( boxCentre, unit ), scaledUnit),
                    addition( addition( boxCentre, unit ), scaledUnit)
                ];

                centreLines.push( { "points": points, "unit": unitDisplacement( centre, boxCentre ), "pd": cpd }  );
                return centreLines.length - 1;
            }

            centrePoints.push( {
                "point": cycleStats.centre,
                "lineRef": getCentreLineRef( cycleStats.centre ),
                "hyp2": centreDist
            } );

            cycleStats.centreRef = centrePoints.length - 1;
        }

        this
            .filter( cycle => cycle.length > 1 )
            .forEach( cycle => assignCentreRef( cycle.getStats(this.box) ) );

        this.$centres = {
            centreLines: centreLines,
            centrePoints: centrePoints
        };

        return this.$centres;
    }

    getIdentityPlane() {
        if ( Object.hasOwn( this, '$identityPlane' ) ) {
            return this.$identityPlane;
        }

        const { centreLines, centrePoints } = this.getCentres();

        if ( centreLines.length > 1 ) {

            const diagonal = centreLines[0].points;
            const otherLine = centreLines[ centreLines.length - 1 ].points;

            // establish identity plane
            const identityPlane = otherLine.map( ( coord, i ) => subtraction( coord, diagonal[i] ) );
            const identityPlaneGcd = Math.abs( gcda( identityPlane ) );
            const identityPlaneNormal = displacement( this.getOrigin(), identityPlane );

            this.$identityPlane = {
                coord: identityPlane,
                gcd: identityPlaneGcd,
                normal: identityPlaneNormal
            };
            return this.$identityPlane;

        } else {
            const bases = this.getBases();

            const placesReverse = this.permPair[0].placeValues;

//            const placesReverse = placeValuesReverseArray( bases );
            const placesForward = [...placesReverse].map( i => -1 * i );

            // establish identity plane
            const identityPlane = placesForward.map( ( x, i ) => x - placesReverse[i] );
            const identityPlaneGcd = Math.abs( gcda( identityPlane ) );
            const identityPlaneNormal = displacement( this.getOrigin(), identityPlane );

            this.$identityPlane = {
                coord: identityPlane,
                gcd: identityPlaneGcd,
                normal: identityPlaneNormal
            };
            return this.$identityPlane;
        }
    }
}
