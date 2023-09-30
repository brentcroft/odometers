
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
    rank() {
        return this.odometer.bases.length;
    }
    specification( invert = false ) {
        return [ '"', invert
            ? [...this.odometer.bases].reverse().join('x')
            : this.odometer.bases.join('x'), '"' ].join('');
    }
    placeValuesStructure( invert = false ) {
        const bases = invert
            ? [...this.odometer.bases].reverse()
            : [...this.odometer.bases];
        return bases.map( ( b, i ) => ( i + 1 ) == bases.length ? '1' : bases.slice( i + 1 ).join( 'x' ) );
    }
    placeValues( invert = false ) {
        const a = this.permBox[0];
        const b = this.permBox.find( p => [1,...a.slice(1)]);
        return (invert
            ? [...b.placeValues]
            :  [...a.placeValues]
        ).reverse();
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
            //point.parity = -1 * point[0];
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
        const twist = true;
        if ( this.actionsCache.length == 0 ) {
            this.actionsCache = this.permBox.flatMap( pr => this.permBox
                .filter( pl => pl != pr )
                .flatMap( pl => {
                    const action = compose( pr, pl, twist, this );
                    action.permPair = [ pr.perm, pl.perm ];
                    return [ action ];
                } ) );
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
