function arrowUp( parity ) {
    return parity ? '🠅' : '🠇';
}
const maybeBracket = ( t ) => Array.isArray(t) && t.length > 3 ? `(${ t })` : t;

const arrayExactlyEquals = (a, b) => a.length == b.length && a.filter( (x,i) => x == b[i] ).length == a.length;
const arrayIntersection = (a,b) => a.filter(v => b.includes(v));
const arrayOfIndexes = ( n ) => new Array( n ).fill( 0 ).map( (x,i) => i );
const arrayCompare = (a, b) => {
    for ( i = b.length - 1; i >= 0; i-- ) {
        if ( a[i] < b[i] ) {
            return -1;
        } else if ( a[i] > b[i] ) {
            return 1;
        }
    }
    return 0;
};
const arrayReverseCompare = (a, b) => {
    for ( i = 0; i < b.length - 1; i++ ) {
        if ( a[i] < b[i] ) {
            return -1;
        } else if ( a[i] > b[i] ) {
            return 1;
        }
    }
    return 0;
};

function rotateArray( array, times = 1 ) {
    if ( times < 0 ) {
        return rotateReverseArray( array, -1 * times );
    }
    for ( var i = 0; i < times; i++ ) {
        array.push( array.shift() );
    }
    return array;
}

function rotateReverseArray( array, times = 1 ) {
    if ( times < 0 ) {
        return rotateArray( array, -1 * times );
    }
    for ( var i = 0; i < times; i++ ) {
        array.unshift( array.pop() );
    }
    return array;
}

function pairs2( list ) {
    if (list.length < 2) {
        return [];
    }
    const first = list[0];
    const rest = list.slice(1);
    const p = rest.map( x => [ first, x ] ).concat( pairs( rest ) );
    return p;
}

function pairs( list, includeIdentities = true ) {
    const p = [];
    if ( includeIdentities ) {
        list.forEach( l1 => p.push( [ l1, l1 ] ) );
    }
    list.forEach( l1 => list.forEach( l2 => l1===l2 ? 0 : p.push( [ l1, l2 ] ) ) );
    return p;
}

const MAX_SAFE_INT = 9007199254740991;
const factorial = n => !(n > 1) ? 1 : factorial(n - 1) * n;
const gcd = (a, b) => a ? gcd( b % a, a) : b;
const lcm = (a, b) => a && b ? a * b / gcd(a, b) : 0;

const PI = 3.1415926;
const TWO_PI = 2 * PI;

const addition          = ( p1, p2 ) => p2.map( (p,i) => p + p1[i] );
const subtraction       = ( p1, p2 ) => p1.map( (p,i) => p - p2[i] );
const displacement      = ( p1, p2 ) => p2.map( (p,i) => p - p1[i] );
const euclideanDistance2 = ( p ) => p.map( d => d**2 ).reduce( (a,v) => a + v, 0 )
const distance2          = ( p1, p2 ) => euclideanDistance2( displacement( p1, p2 ) );
const scale             = ( p, s ) => p.map( x => x * s );
const dotProduct        = ( p1, p2 ) => p2.map( (x,i) => x * p1[i] ).reduce( (a,c) => a + c, 0 );
const crossProduct      = ( p1, p2 ) => [
      p1[1] * p2[2] - p1[2] * p2[1],
      p1[2] * p2[0] - p1[0] * p2[2],
      p1[0] * p2[1] - p1[1] * p2[0]
];
const gcda = (a) => {
    let result = a[0];
    for (let i = 1; i < a.length; i++) {
        result = gcd(a[i], result);
        if(result == 1) {
            return 1;
        }
    }
    return result;
};
const lcma = (a) => {
    let result = a[0];
    for (let i = 1; i < a.length; i++) {
        result = lcm(a[i], result);
        if(result == 0) {
            return 0;
        }
    }
    return result;
};
const normalize = (d) => {
    const ed = Math.sqrt( euclideanDistance2( d ) );
    return d.map( x => x / ed );
};
const unitDisplacement  = ( p1, p2 ) => normalize( displacement( p1, p2 ) );
function extendLine( p1, p2, scale = 0 ) {
    const v = displacement( p1, p2 );
    const r = Math.sqrt( euclideanDistance2( v ) );
    if ( r == 0 ) {
        return [ p1, p2 ];
    }
    const d = v.map( (x,i) => ( scale * x / r ) );
    const p0 = p1.map( (p, i) => p - d[i] );
    const p3 = p2.map( (p, i) => p + d[i] );
    return [ p0, p1, p2, p3 ];
}

function getMultiplicativeGroupMember( terminal, member ) {
    const identity = [ ...Array( terminal ).keys() ];
    const index = [...identity];
    var id = 0;
    var i = 0;
    index[i] = id;
    id = (id + member) % terminal;
    while (id != 0) {
        i++;
        index[i] = id;
        id = (id + member) % terminal;
    }
    // add fixed point
    index.push(terminal);
    return {
        'member': member,
        'terminal': terminal,
        'index': index
    };
}
