class Cycle extends Array {
    constructor() {
        super( arguments.length > 0 && Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
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
//            const C = [];
//            const order = this.order();
//            const terminalCoords = this.getTerminal();
//            const bases = this.box.odometer.bases;
//            const factor = BigNumber(this.box.length - 1);
//            bases.forEach( (base, bI) => {
//                const baseIndex = bI; //(bases.length -1 - bI);
//                const bnb = BigNumber(base);
//                const terminalCoord = terminalCoords[baseIndex];
//                const coeffs = [];
//                for (var i = 0; i < order; i++) {
//                    coeffs.push( terminalCoord );
//                }
//                var acc1 = BigNumber(0);
//                var basePower1 = BigNumber(1);
//                coeffs.forEach( (coeff, place) => {
//                    acc1 = acc1.plus( basePower1.multipliedBy(coeff) );
//                    basePower1 = basePower1.multipliedBy(bnb);
//                } );
//                C.push( acc1.dividedBy( factor ) );
//            } );
            this.$C = terminalPolynomials( this.order(), this.box.odometer.bases ).map( tp => tp.dividedBy( this.box.length - 1 ));
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
