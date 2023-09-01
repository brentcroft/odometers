

/**
*/
class Dial extends Array {

    constructor( label, symbols ) {
        super( arguments.length > 0 &&  Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
        if ( Array.isArray(symbols) ) {
            this.label = label;
            this.push( ...symbols );
        }
    }

    symbols() {
         return [ ...this ];
     }

    toString() {
        return `${ this.label }:(${ this.join( ',' ) })`;
    }
}

// a sequence of Dial
class Odometer extends Array {

    constructor( dials ) {
        super( arguments.length > 0 &&  Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
        if ( Array.isArray(dials) ) {
            this.push( ...dials );
            this.bases = dials.map( dial => dial.length );
        }
    }

    push( ...items ) {
        const nonDials = items.filter( item => !( item instanceof Dial ) );
        if ( nonDials && nonDials.length > 0 ) {
            throw new Error( `Can only add items of type Dial: ${ nonDials.length } bad items.` );
        }
        super.push( ...items );
    }

    volume() {
        return this.map( d => d.length ).reduce( (a,c) => a * c, 1 );
    }

    incrementLeftToRight( coord ) {
        for ( var i = 0; i < coord.length; i++ ) {
            const dial = this[i];
            if (coord[i] < (dial.length - 1) ) {
                coord[i]++;
                return;
            } else {
                coord[i] = 0;
            }
        }
    }

    incrementRightToLeft( coord ) {
        for ( var i = coord.length - 1; i >= 0; i-- ) {
            const dial = this[i];
            if (coord[i] < (dial.length - 1) ) {
                coord[i]++;
                return;
            } else {
                coord[i] = 0;
            }
        }
    }

    increment( coord ) {
        this.incrementLeftToRight( coord );
    }
}

// each setting represents an index construction
// on a box with n dimensions
class FactorialOdometer extends Odometer {
    static FACTORIAL_DIALS = n => {
        const dials = [];
        for ( var i = 2; i <= n; i++ ) {
            dials.push( new Dial( 'a', arrayOfIndexes( i ) ) );
        }
        return dials;
    };

    constructor( n ) {
        super( FactorialOdometer.FACTORIAL_DIALS( n ) );
    }
}

class Point extends Array {
    constructor( coord ) {
        super( arguments.length > 0 &&  Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
        if ( Array.isArray(coord) ) {
            this.push( ...coord );
        }
    }

    label() {
        return this.key;
    }
}

class AbstractBox extends Array {

    constructor( odometer ) {
        super( arguments.length > 0 &&  Number.isInteger( arguments[0] ) ? arguments[0] : 0 );
        if ( Array.isArray(odometer) ) {
            this.odometer = odometer;
            this.centre = this.odometer.bases.map( b => b / 2);
        }
    }

    buildPoints() {
        this.length = 0;
        const dials = this.odometer;
        var coord = new Array( dials.length ).fill( 0 );
        this.push( new Point( coord ) );
        this.odometer.increment( coord );
        for ( var i = 0; i < (this.volume - 1); i++ ) {
            this.push( new Point( coord ) );
            this.odometer.increment( coord );
        }
    }
}

class FactorialBox extends AbstractBox {
    //static ROTATION_KEYS = "αβγδεζηθικλμξνοπρςστυφχψω";
    static LABELS = [
        [ '🠇', '🠅'],
        [ 'α', 'β', 'γ' ],
        [ '♤', '♡', '♢', '♧' ],
        [ '1', '2', '3', '4', '5' ],
        [ 'A', 'B', 'C', 'D', 'E', 'F' ],
    ];
    // TODO: understand mapping from factorial coords to label scheme
    static LABEL_MAPS = [
        // 2D
        [],
        // 3D
        [
            [ [1,0], [1,1] ]
        ],
        // 4D
        [
            [ [1,0,0], [1,1,1] ],
            [ [1,1,0], [1,0,1] ],

            [ [1,1,3], [1,0,2] ],
            [ [1,1,2], [1,0,3] ],

            [ [1,2,1], [1,2,0] ],
            [ [1,2,3], [1,2,2] ]
        ],
        // 5D
        [],
        // 6D
        []
    ];

    constructor( boxOdometer ) {
        super( arguments.length > 0 &&  Number.isInteger( arguments[0] )
            ? arguments[0]
            : new FactorialOdometer( boxOdometer.length ) );
        if ( Array.isArray(boxOdometer) ) {
            this.volume = this.odometer.volume();
            this.buildPoints( boxOdometer );
        }
    }

    permute( list, perm ) {
        for ( var i = 0; i < perm.length; i++ ) {
            if (perm[i] > 0) {
                const b = list.slice( 0, i + 2 );
                rotateReverseArray( b, perm[i] );
                list.splice( 0, b.length, ...b );
            }
        }
    }

    unpermute( list, perm ) {
        for ( var i = perm.length - 1; i >= 0; i-- ) {
            if (perm[i] > 0) {
                const b = list.slice( 0, i + 2 );
                rotateArray( b, perm[i] );
                list.splice( 0, b.length, ...b );
            }
        }
    }

    alignPoint( point ) {
        const alignments = FactorialBox.LABEL_MAPS[ point.length - 1 ]
        if (alignments) {
            alignments.forEach( alignment => {
                if ( arrayExactlyEquals( point, alignment[0] ) ) {
                    point.length = 0;
                    point.push( ...alignment[1] );
                } else if ( arrayExactlyEquals( point, alignment[1] ) ) {
                    point.length = 0;
                    point.push( ...alignment[0] );
                }
            } );
        }
    }

    makeLabel( coord ) {
        const label = [];
        if ( coord.length == 0 ) {
            label.push( '#' )
        } else {
            for ( var i = 0; i < coord.length; i++ ) {
                const p = coord[i];
                const labels = FactorialBox.LABELS[i];
                label.push( labels[p] );
            }
        }
        // label goes in reverse to factorial coord
        return label.reverse();
    }

    placeValues( bases ) {
        var acc = 1;
        const p = new Array( bases.length ).fill( 0 );
        for ( var i = 0; i < bases.length; i++ ) {
            p[i] = acc;
            acc = acc * bases[i];
        }
        return p;
    }

    buildPoints( boxOdometer ) {
        super.buildPoints();
        const width = boxOdometer.length;
        const dialLengths = boxOdometer.map( dial => dial.length );
        this.forEach( point => {

            const perm = arrayOfIndexes( width );
            this.permute( perm, point );
            point.perm = perm;

            const antiPerm = arrayOfIndexes( width );
            this.unpermute( antiPerm, point );
            point.antiPerm = antiPerm;

            // sacrificial copy
            const bases = [...dialLengths];
            this.permute( bases, point );
            point.bases = bases;

            const placeValues = this.placeValues( bases );
            this.unpermute( placeValues, point );
            point.placeValues = placeValues;

            this.alignPoint( point );
            point.key = this.makeLabel( point ).join('');

            point.index = [];
            point.parity = -1 * point[0];
        } );
        this.forEach( point => {
            if (!point.inverse) {
                const inverseBases = [...point.bases].reverse();
                point.inverse = this.find( p => arrayExactlyEquals( p.bases, inverseBases ) );
            }
        } );
    }
}


class Box extends AbstractBox {

    static boxes = {};

    static list() {
        const values = Object.values( Box.boxes );
        const boxComparator = ( b0, b1 ) => {
            if ( b0.odometer.bases.length == b1.odometer.bases.length ) {
                return arrayCompare( b0.odometer.bases, b1.odometer.bases );
            } else {
                return b0.odometer.bases.length - b1.odometer.bases.length;
            }
        };
        values.sort( boxComparator );
        return values;
    }

    static clear() {
        Object.keys( Box.boxes ).forEach( key => {
            delete Box.boxes[ key ];
        } );
    }

    static identifySources( source ) {
        const sortedBoxes = Box.list();
        const candidates = sortedBoxes.length == 0
           ? []
           : sortedBoxes
               .filter( box => box.volume == source.index.length )
               .flatMap( box => box.actions() )
               .filter( action => action != source )
               .filter( action => action.label() != source.label() )
               .filter( action => arrayExactlyEquals( source.index, action.index ) );
        return candidates;
    }

    static of( bases ) {
//        const canonicalBases = [...bases].filter( b => b != 1 );
        const canonicalBases = [...bases];
        canonicalBases.sort( (a,b) => b - a );

        const key = canonicalBases.join( '.' );
        if (!( key in Box.boxes )) {
            const box = new Box( new Odometer( canonicalBases.map( (b,i) => new Dial( `${i}`, arrayOfIndexes( b ) ) ) ) );
            Box.boxes[key] = box;
        }
        return Box.boxes[key];
    }

    constructor( odometer ) {
        super( arguments.length > 0 && Number.isInteger( arguments[0] ) ? arguments[0] : odometer );
        if ( Array.isArray(odometer) ) {
            this.permBox = new FactorialBox( this.odometer );
            this.volume = this.odometer.volume();
            this.buildPoints();
            this.indexPoints();
            this.actionsCache = [];
        }
    }

    indexPoint( coord, placeValues ) {
        return coord.map( (c,i) => c * placeValues[i] ).reduce( (a,c) => a + c, 0 );
    }

    indexPoints() {
        this.forEach( point => {
            this.permBox.forEach( perm => {
                const id = this.indexPoint( point, perm.placeValues );
                perm.index.push( id );
            } );
        } );
        this.permBox.forEach( perm => {
            perm.cycles = cycles( perm );
            const inversePerm = inverse( perm );
            const candidate = this.permBox.find( p => arrayExactlyEquals( p.index, inversePerm.index ) );
            perm.inverse = candidate;
        } );
    }

    actions() {
        if ( this.actionsCache.length == 0 ) {
            this.actionsCache = this.permBox.flatMap( pr => this.permBox
                .filter( pl => pl != pr )
                .map( pl => {
                    const c = compose( pr, pl, true, this );
                    c.parity = arrayCompare( pl.perm, pr.perm ) > 0;
                    return c;
                } ) );


            // assign inverses
            const inverseOf = ( idx ) => {
                const index = new Array( idx.length );
                for ( var i = 0; i < idx.length; i++ ) {
                    index[i] = idx.indexOf(i);
                }
                return index;
            };

            this.actionsCache.forEach( a0 => {
                if (!Object.hasOwn( a0, 'inverse' )) {
                    const dix = inverseOf( a0.index );
                    const a1 = this.actionsCache
                        .filter( a => !Object.hasOwn( a, 'inverse' ) )
                        .find( a => arrayExactlyEquals( a.index, dix ) );
                    if (a1) {
                        a0.inverse = a1;
                        a1.inverse = a0;
                    } else {
//                        a0.inverse = null;
//                        throw new Error(`Inverse not found: ${a0.label()}`);
                    }
                }
            } );

        }
        return this.actionsCache;
    }

    testPermBox() {
        this.forEach( point => {
            this.permBox
                .forEach( permPoint => {
                    const roundTrip = [...point];
                    this.permBox.permute( roundTrip, permPoint );
                    this.permBox.unpermute( roundTrip, permPoint );
                    if ( !arrayExactlyEquals( point, roundTrip ) ) {
                        throw ( `Failed round trip: ${ point } !=  ${ roundTrip }` );
                    }
                } );
        } );
    }
}



//Box.of( [2, 3, 5, 7 ] ).testPermBox();