
Box.prototype.explanation = function(invert = false) {
    const bases = invert ? [...this.odometer.bases].reverse() : [...this.odometer.bases];
    return bases.map( (b,i) => ( i == bases.length - 1 ) ? `a sequence of ${ b } points` : `${ b } copies of ` ).join( '' );
};

Box.prototype.packingTable = function( invert = false ) {
    const cellFn = ( coord, serial ) => `${ serial }<sub>(${ coord.join( ',' ) })</sub>`;
    const bases = invert ? [...this.odometer.bases].reverse() : [...this.odometer.bases];
    const caption = `Box specification: ${ this.specification( invert ) }`;
    const rank = this.rank();
    var pointIndex = 0;
    const _walkBases = ( inverted = false, place = 0, locusStack = [] ) => {
        if ( place == rank ) {
            const pid = pointIndex;
            pointIndex++;
            const coord = invert ? [...locusStack].reverse() : locusStack;
            return reify( "td", { 'class' : 'cell' }, [], [ c => c.innerHTML = cellFn( coord, pid ) ] );
        } else {
            const isRow = ( 0 != ( rank - place ) % 2 );
            const holder = isRow
                ? reify( "tr", { 'class' : 'pack' } )
                : ( place == 0 )
                    ? reify( "table", { 'class' : 'packing' } )
                    : reify( "td", { 'class' : 'pack' } );
            for ( var i = 0; i < bases[ place ]; i++) {
                locusStack.push( i );
                const cell = _walkBases( inverted, place + 1, locusStack );
                locusStack.pop();
                if ( isRow ) {
                    holder.appendChild( cell );
                } else {
                    holder.insertBefore( reify( "tr", {}, [ reify( "td", { 'class' : 'pack' } , [ cell ] ) ] ), holder.firstChild );
                }
            }
            if ( isRow ) {
                return reify( "table", { 'class' : 'pack' }, [ holder ] );
            } else {
                return holder;
            }
        }
    }
    const table = _walkBases( invert );
    table.createCaption().textContent = caption;
    table.classList.remove( 'pack' );
    table.classList.add( 'packing' );
    return table;
}

Box.prototype.placeValueTable = function( maxRows, order, invert = false ) {
    const bases = invert ? [...this.odometer.bases].reverse() : [...this.odometer.bases];
    const placeOrder = order || new Array( bases.length ).fill( 0 ).map( (_,i) => i );
    function reorder( coord, order ) {
        return order.map( i => coord[i] );
    }
    var pointIndex = 0;
    const _walkBases = ( cellFn, place = 0, locusStack = [] ) => {
        if ( place == bases.length ) {
            const pid = pointIndex;
            pointIndex++;
            cellFn( locusStack, pid );
        } else {
            for ( var i = 0; i < bases[ place ]; i++) {
                locusStack.push( i );
                _walkBases( cellFn, place + 1, locusStack );
                locusStack.pop();
            }
        }
    };
    const rowData = [];
    _walkBases( (coord, id) => rowData.push( [ reorder( coord, placeOrder ), id ] ) );

//    rowData.sort( (a,b) => arrayCompare( a[0], b[0] ) );

    const rows = rowData
        .map( ( [ coord, index ], i ) => reify( "tr", {}, [
                ...coord.map( b => reify( "td", { "class": "places-left" }, [], [ c => c.innerHTML = b ] ) ),
                reify( "td", { "class": "tally-value" }, [], [ c => c.innerHTML = index ] )
             ] ) );
    const rowsPerTable = maxRows || rows.length;
    const cols = maxRows ? Math.ceil( rows.length / rowsPerTable ) : 1;
    const tables = [];
    const placeValuesHeader = reorder(
        bases
            .map( ( b, i ) => reify(
                "th",
                { "class": "places-left" },
                [],
                [ c => c.innerHTML = ( i + 1 ) == bases.length ? 1 : bases.slice( i + 1 ).join( 'x' ) ] )
            ),
        placeOrder
    );

    for ( var i = 0; i < cols; i++ ) {
        const tableRows = rows.splice( 0, rowsPerTable );
        const table = reify( "table", { "class": "place-values-table"}, [
            reify( "tr", {}, [
                    reify( "th", { "colspan": bases.length }, [], [ c => c.innerHTML = 'Coordinate' ] ),
                    reify( "th", {}, [], [ c => c.innerHTML = 'Index' ] )
                ]
            ),
            reify( "tr", {}, [
                    ...reorder(
                        bases
                            .map( ( b, i ) => reify( "th",
                                { "class": "places-left" },
                                [],
                                [ c => c.innerHTML = ( i + 1 ) == bases.length ? 1 : bases.slice( i + 1 ).join( 'x' ) ] )
                            ),
                        placeOrder
                    ),
                    reify( "th", { "class": "places-left" }, [], [ c => c.innerHTML = '' ] )
                ]
            ),
            ...tableRows
        ] );

        //table.createCaption().textContent = caption;

        tables.push( table );
    }

    if ( tables.length == 1 ) {
        return tables[0];
    } else {
        return reify( "table", {}, [
            reify( "tr", {}, tables.map( table => reify( "td", {}, [ table ] ) ) )
        ] );
    }
};

Box.prototype.compareBoxSpecificationsTable = function( invert = false ) {
    const rowData = [
        [ this.specification(invert), ...this.permBox[ invert ? 1 : 0 ].index ],
        [ this.specification( !invert ), ...this.permBox[ invert ? 0 : 1 ].index ]
    ];
    return reify( "table", { "class": "raw-permutation" },
        rowData.map( row => reify( "tr", {},
            row.map( ( v, i ) => reify( "td", { "class": "" }, [ reifyText( `${ v }` ) ] ) ) )
        )
    );
}
