
function cycles( source ) {
    const ri = [...source.index];
    const cycles = new Cycles();
    cycles.key = source.key;
    cycles.name = source.name;
    cycles.permPair = source.sources;
    cycles.box = source.box;
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
