
Cycle.prototype.htmlEquations = function( cycles ) {
    return reify(
        "table",
        { 'class': 'polynomials' },
        cyclePolynomials( cycles, this ).map( (
            {
            'acc': acc,
            'base': base,
            'coeffs': coeffs,
            'factor': factor,
            'fixedFactor': fixedFactor,
            'error': error,
            'terminal': terminal
            } ) => reify( 'tr', { 'class' : 'polynomials' } , [
                reify( 'td', { 'class' : 'polynomials' } , [
                ...coeffs.flatMap( (c,i) => [ reify( "b", {}, [ base > 10 ? reifyText( '&emsp14;' ) : null, reifyText( `${ c }` ) ] ) ] ),
                reify( "sub", {}, [ reifyText( `${ base }` ) ] )
                ] ),
                reify( 'td', { 'class' : 'polynomials' } , [ reifyText( ' = ' ) ] ),
                reify( 'td', { 'class' : 'polynomials' } , [
                    reifyText( `${ acc } ` ),
                    reify( "i", {}, [
                    'uf' == error
                        ? reify( "span", { 'class': 'uf' }, [ reifyText( '(uf)' ) ] )
                        : 'fixedFactor' == error
                            ? reify( "span", { 'class': 'fixedFactor' }, [ reifyText( `(${ acc / fixedFactor } x ${ fixedFactor })` ) ] )
                            : 'factor' == error
                                ? reify( "span", { 'class': 'factor' }, [ reifyText( `(${ factor } x ${ acc / factor })` ) ] )
                                : reifyText( ` (${ factor } x ${ fixedFactor })` ),
                    ] )
                ] )
            ] )
        )
    );
}

Cycles.prototype.htmlMonomial = function() {
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

Cycles.prototype.cyclesView = {
    'normal': { orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'default': { width: '100%', height: '100%', orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'resizable': { width: '100%', height: '100%', orientation: '-1 -1 0 0.5', position: '-3.5 2.4 7' },
    'short': { width: '100%', height: '100%', orientation: '1 0 0 -1.6', position: '0 3.5 0' },
    'table': { width: '200px', height: '100px', orientation: '0 0 0 1', position: '0 0 10' },
};

Cycles.prototype.x3dCycles = function( param = { 'toggles': ['lines'] }, view = 'table' ) {
    return buildX3DomRootNode( getCyclesDiagram( this, param ), this.cyclesView[ view ] );
}

Cycles.prototype.boxesView = {
    'default': { width: '100%', height: '92%', orientation: '0 0 0 1', position: '0 2 20' },
    'table': { width: '200px', height: '100px', orientation: '0 0 0 1', position: '0 0 10' },
};

Cycles.prototype.x3dBoxes = function( param = { 'toggles': ['lines', 'grid', 'plane', 'centres'] }, view = 'default' ) {
    return buildX3DomRootNode( getCyclesPointsDiagram( this, param ), this.boxesView[ view ] );
}

Cycles.prototype.htmlSummary = function() {
     return reify( "div",{}, [
         reifyText( this.label() ),
         reifyText( " " ),
//         reifyText( `(box=[${ this.getBases()}], p=${ this.parity }, v=${this.getVolume()}, o=${this.order()}) ` ),
         reifyText( `box=[${ this.getBases()}], v=${this.getVolume()}, o=${this.order()}, c=[${this.C()}] ` ),
         reifyText( " : " ),
         reifyText( " &rarr; " ),
         this.htmlMonomial()
      ] );
};
Cycles.prototype.htmlTableColumns = [ 'rotate', 'orbit', 'id-sum', 'coords-sum', 'order', 'per2', 'rad' ];
Cycles.prototype.htmlTableDiagramOptions = [ 'show', 'lines', 'grid', 'centres' ];
Cycles.prototype.htmlTable = function() {

    const allColumns = [ 'rotate', 'orbit', 'id-sum', 'coords', 'coords-sum', 'order', 'per2', 'rad', 'polynomials' ];
    const columns = [ '#', ...arrayIntersection( allColumns, this.htmlTableColumns ) ];
    const maybeDisplay = (label, domFn, clearFn) => this.htmlTableColumns.includes( label ) ? domFn() : clearFn ? clearFn() : null;

    const bases = this.getBases();
    const volume = this.getVolume();
    const maxIndex = volume - 1;

    const initialPointsSum = new Array( this.getRank() ).fill( 0 );

    const identities =  this.identities();
    const identityPointsSum = identities
        .map( cycle => this.box[cycle[0]] )
        .reduce( (a, coord) => addition( a, coord ), initialPointsSum );
    const identityIdSum = identities
        .map( cycle => cycle[0] )
        .reduce( (a, id) => a + id, 0 );
    const identityIdSumGcd = gcd( maxIndex, identityIdSum );



    const tableContainer = reify( 'div' );
    const diagramContainer = reify( 'div', { 'style': 'border: solid black 1px; resize: both; overflow: auto; width: 100%; height: 300px;' } );

    const showOrbit = ( orbitId ) => {
        const orbits = diagramContainer.querySelectorAll( ".orbit-line" );
        orbits.forEach( orbitElement => {
            if ( !orbitId ) {
                orbitElement.setAttribute( "render", true );
                orbitElement.classList.remove("selected");
            } else if ( orbitId == orbitElement.id ) {
                if ( orbitElement.classList.contains( "selected" ) ) {
                    orbitElement.setAttribute( "render", false );
                    orbitElement.classList.remove("selected");
                } else {
                    orbitElement.setAttribute( "render", true );
                    orbitElement.classList.add("selected");
                }
            } else if ( 'orbit.e' == orbitElement.id ) {
                orbitElement.setAttribute( "render", true );
                orbitElement.classList.remove("selected");
            } else if (!orbitElement.classList.contains( "selected" )) {
                orbitElement.setAttribute( "render", false );
            }
        });
    }

    const onRowSelectionFactory = ( source, orbit, i ) => {
        return ( event ) => {
            const classList = source.classList;
            if ( classList.contains( 'selected' ) ) {
                classList.remove( 'selected' );
            } else if ( source.id ) {
                classList.add( 'selected' );
            }
            showOrbit( source.id );
       };
    };

    const identityRow = () => [
        reifyText( '<code>e</code>' ),
        maybeDisplay( 'rotate', () => reify( 'span', {}, [] ) ),
        maybeDisplay( 'orbit', () => reifyText( identities.map( cycle => `(${ cycle })` ).join( ', ' ) ) ),
        maybeDisplay( 'id-sum', () => reifyText( `<code>${ identityIdSum }</code>` ) ),
        maybeDisplay( 'coords', () => reifyText( identities.map( cycle => cycle.map( c => `(${ this.box[c] })` ) ).join( ', ' ) ) ),
        maybeDisplay( 'coords-sum', () => reifyText( `<code>(${ identityPointsSum })</code>` ) ),
        maybeDisplay( 'order', () => reifyText( `<code>1</code>` ) ),
        maybeDisplay( 'per2', () => reifyText( `<code>0</code>` ) ),
        maybeDisplay( 'rad', () => reifyText( `<code>0</code>` ) ),
//        maybeDisplay( 'polynomials', () => identities[identities.length-1].htmlEquations( this ) ),
        maybeDisplay( 'polynomials', () => reify( 'div', {}, identities.slice(1).map( identity => identity.htmlEquations( this ) ) ) ),
    ].filter( h => h );

    const totals = this.getStats();

    const footerRow = () => [
        reifyText( '' ),
        maybeDisplay( 'rotate', () => reify( 'span', {}, [] ) ),
        maybeDisplay( 'orbit', () => reifyText( '' ) ),
        maybeDisplay( 'id-sum', () => reifyText( `<code>${ totals.idSum }</code>`, { 'class': 'sum-total' } ) ),
        maybeDisplay( 'coords', () => reifyText( '' ) ) ,
        maybeDisplay( 'coords-sum', () => reifyText( `<code>${ totals.coordsSum }</code>`, { 'class': 'sum-total' } ) ),
        maybeDisplay( 'order', () => reifyText( `<code>${ this.order() }</code>`, { 'class': 'sum-total' } ) ),
        maybeDisplay( 'per2', () => reifyText( `<code>${ totals.euclideanPerimeter }</code>`, { 'class': 'sum-total' } ) ),
        maybeDisplay( 'rad', () => reifyText( `<code>${ totals.indexPerimeter }</code>`, { 'class': 'sum-total' } ) ),
        maybeDisplay( 'polynomials', () => reifyText( '' ) ),
    ].filter(h => h );

    const [ masterArrow, slaveArrow ] = [ '&#129110', '&#129109' ];
    const complementCode = ( cycle ) => cycle.complementCode == 1
            ? masterArrow
            : cycle.complementCode == -1
                ? slaveArrow
                : '';

    const cellsRenderer = ( orbit, stats, i ) => [
        reify( "td", {}, [ reify( "sup", {}, [ reifyText( `${ i + 1 }` ) ] ) ] ),
        maybeDisplay( 'rotate', () => reify( "td", {}, [
            reify('b', { 'class': 'control' }, [ reifyText( '&larr;' ) ], [ c => c.onclick = rotateOrbit( orbit, stats, i, 1 ) ] ),
            reifyText( '&nbsp;&nbsp;&nbsp;&nbsp;' ),
            reify('b', { 'class': 'control' }, [ reifyText( '&rarr;' ) ], [ c => c.onclick = rotateOrbit( orbit, stats, i, -1 ) ] ),
        ] ) ),
        maybeDisplay( 'orbit', () => reify( "td", { cssClass: [ 'orbit' ] }, [
            reifyText( `(${ orbit })` ),
            reifyText( complementCode( orbit ) ),
        ] ) ),
        maybeDisplay( 'id-sum', () => reify( "td", {}, [ reifyText( `${ stats.idSum }` ) ] ) ),
        maybeDisplay( 'coords', () => reify( "td", { cssClass: [ 'orbit' ] }, [ reifyText( orbit.map( c => `(${ this.box[c] })` ) ) ] ) ),
        maybeDisplay( 'coords-sum', () => reify( "td", {}, [ reifyText( `(${ stats.coordsSum.join( ', ' ) })` ) ] ) ),
        maybeDisplay( 'order', () => reify( "td", {}, [ reifyText( `${ orbit.length }` ) ] ) ),
        maybeDisplay( 'per2', () => reify( "td", {}, [ reifyText( `${ stats.euclideanPerimeter }` ) ] ) ),
        maybeDisplay( 'rad', () => reify( "td", {}, [ reifyText( `${ stats.indexPerimeter }` ) ] ) ),
        maybeDisplay( 'polynomials', () => reify( "td", {}, [ orbit.htmlEquations( this ) ] ) ),
    ];
    
    const rowRenderer = ( orbit, stats, i ) => reify(
        "tr",
        { 'id': `orbit.${ i }`, 'class': 'orbit-row' },
        cellsRenderer( orbit, stats, i ),
        [ c => c.onclick = onRowSelectionFactory( c, orbit, i ) ]
    );

    const rotateOrbit = ( orbit, stats, i, r ) => {
        return ( event ) => {
            event.stopPropagation();
            const rowId = `orbit.${ i }`;
            const orbitRows = tableContainer.querySelectorAll( '.orbit-row' );
            orbitRows.forEach( row => {
                if (row.id == rowId) {
                    rotateArray( orbit, r );
                    const cells = cellsRenderer( orbit, stats, i );
                    row.innerHTML = '';
                    cells.filter( cell => cell ).forEach( cell => row.appendChild( cell ) );
                }
            } );
        }
    };

    const tableRenderer = (orbits) => reify(
        "table",
         { 'cssClass': [ 'box-action' ] },
         [
            reify( "caption", {}, [ this.htmlSummary() ] ),
            reify( 'tr', {}, [ '#', ...arrayIntersection( allColumns, columns ) ].map( (column, i) => reify( 'th', {}, [ reifyText( column ) ], [ c => c.onclick = () => sortTable( c, i ) ] ) ) ),
            reify( "tr", { 'id': 'orbit.e' }, identityRow().map( ir => reify( "td", {}, [ ir ] ) ), [ c => c.onclick = onRowSelectionFactory( c ) ] ),
            ...orbits
                .map( orbit => [ orbit, orbit.getStats( this.box ) ] )
                .map( ( [ orbit, stats ], i ) => rowRenderer( orbit, stats, i ) ),
            reify( "tr", {}, footerRow().map( col => reify( "td", {}, [ col ] ) ), [ c => c.onclick = onRowSelectionFactory( c ) ] ),
         ] );

    const orbits =  this.filter( cycle => cycle.length > 1 );
    const columnSelectors = allColumns
        .map( (column,i) => reify( 'label', { 'class': 'columnSelector' }, [
            i == 0 ? null : reifyText( '| ' ),
            reifyText( column ),
            reify( 'input', { 'type': 'checkbox', 'checked': ( columns.includes( column ) ? 'checked' : '' ) }, [], [
                c => c.onchange = () => {
                    if ( !c.checked && this.htmlTableColumns.includes( column ) ) {
                        this.htmlTableColumns.splice( this.htmlTableColumns.indexOf(column), 1 );
                        columns.length = 0;
                        columns.push( '#', ...arrayIntersection( allColumns, this.htmlTableColumns ) );
                        tableContainer.innerHTML = '';
                        tableContainer.appendChild( tableRenderer( orbits ) );

                    } else if ( c.checked && !this.htmlTableColumns.includes( column ) ) {
                        this.htmlTableColumns.push( column );
                        columns.length = 0;
                        columns.push( '#', ...arrayIntersection( allColumns, this.htmlTableColumns ) );
                        tableContainer.innerHTML = '';
                        tableContainer.appendChild( tableRenderer( orbits ) );
                    }
                }
            ] )
        ] ) );

    const allDiagramOptions = [ 'show', '3d', 'lines', 'grid', 'centres', 'plane' ];
    const diagramOptions = arrayIntersection( allDiagramOptions, this.htmlTableDiagramOptions );
    const replaceDiagram = () => {
        diagramContainer.innerHTML = '';
        if (diagramOptions.includes('show')) {
            diagramContainer.appendChild(
                diagramOptions.includes( '3d' )
                    ? this.x3dBoxes( param = { 'toggles': diagramOptions }, view = 'default' )
                    : this.x3dCycles( param = { 'toggles': diagramOptions }, view = 'default' )
            );
            x3dom.reload();
        }
    };
    const diagramOptionsSelectors = allDiagramOptions
        .map( (diagramOption,i) => reify( 'label', { 'class': 'columnSelector' }, [
            i == 0 ? null : reifyText( '| ' ),
            reifyText( diagramOption ),
            reify( 'input', { 'type': 'checkbox', 'checked': ( this.htmlTableDiagramOptions.includes( diagramOption ) ? 'checked' : '' ) }, [], [
                c => c.onchange = () => {
                    if ( !c.checked && this.htmlTableDiagramOptions.includes( diagramOption ) ) {
                        this.htmlTableDiagramOptions.splice( this.htmlTableDiagramOptions.indexOf(diagramOption), 1 );
                    } else if ( c.checked && !this.htmlTableDiagramOptions.includes( diagramOption ) ) {
                        this.htmlTableDiagramOptions.push( diagramOption );
                    }
                    diagramOptions.length = 0;
                    diagramOptions.push( ...arrayIntersection( allDiagramOptions, this.htmlTableDiagramOptions ) );
                    replaceDiagram();
                }
            ] )
        ] ) );

    const diagramLegend = reify( 'div', { 'class': 'legend' }, [
        reifyText( '[ a, r, u | e, f, l, w, <space> ] see: ' ),
        reify( 'a', { 'href': 'https://doc.x3dom.org/tutorials/animationInteraction/navigation/index.html', 'target': '_blank' }, [
            reifyText( 'x3dom navigation tutorial' )
        ] )
    ] );

    const tableLegend = reify( 'div', { 'class': 'legend' }, [
        reifyText( 'Click on a cell to select/deselect or on a totals cell to draw all.' )
    ] );

    tableContainer.appendChild( tableRenderer( orbits ) );
    replaceDiagram();

    return reify( 'div', {}, [
        reify( 'div', {}, [
            reify( 'label', { 'class': 'columnSelector' }, [ reifyText( 'diagram: ' ) ] ),
            ...diagramOptionsSelectors
        ] ),

        diagramOptions.includes( 'show') ? diagramContainer : null,
        diagramOptions.includes( 'show') ? diagramLegend : null,

        reify( 'div', {}, [
            reify( 'label', { 'class': 'columnSelector' }, [ reifyText( 'columns: ' ) ] ),
            ...columnSelectors
        ] ),
        tableContainer,
        tableLegend
    ]);
};


AbstractBox.prototype.pointsDomNode = function() {
    const columns = [ '#', 'coord', 'indexes' ];
    return reify(
        'table',
        { 'class': 'box-action' },
        [
            reify( 'tr', {}, columns.map( column => reify( 'th', {}, [ reifyText( column ) ] ) ) ),
            ...this.points().map( (point, i) => reify(
                    'tr',
                    {},
                    [
                        reify( 'td', {}, [ reifyText( `${ i }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ point }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ point.indexes }` ) ] )
                    ]
                )
            )
        ]
    );
}


FactorialBox.prototype.pointsDomNode = function(
        cols = [ '#', 'label', 'monomial', 'index', 'cycles' ],
        caption = null) {
    const isInverse = (a,b) => {
        const a0 = [...a];
        a0[0] = (a0[0] + 1) % 2;
        return arrayExactlyEquals( a0, b );
    };
    const allColumns = [ 'label', 'alias', 'label-coord', 'coord', 'perm', 'anti-perm', 'bases', 'place-values',
        'inverse', 'i-label-coord', 'i-coord', 'match', 'monomial', 'index', 'cycles', 'diagram' ];
    const columns = [ '#', ...arrayIntersection( allColumns, cols ) ];
    const maybeDisplay = (label, domFn) => columns.includes( label ) ? domFn() : null;

    const points = this;
    return reify(
        'table',
        { 'class': ['box-action', 'sortable'] },
        [
            caption
                ? reify( 'caption',{}, [ reifyText( caption ) ] )
                : reify( 'caption',{}, [ reifyText( `Points of [${ this.odometer.bases }]` ) ] ),
            reify(
                'tr',
                {},
                columns.map( (column,i) => reify( 'th', {}, [ reifyText( column ) ], [ c => c.onclick = () => sortTable( c, i ) ] ) )
            ),
            ...points.map( (point, i) => reify(
                    'tr',
                    {},
                    [
                        reify( 'td', {}, [ reifyText( `${ i + 1 }` ) ] ),
                        !columns.includes( 'label' ) ? null : reify( 'td', {}, [ reifyText( `${ point.label() }` ) ] ),
                        !columns.includes( 'alias' ) ? null : reify( 'td', {}, [ reifyText( point.cycles.others ? `[${ point.cycles.others.map(o => o.key).join("=") }]` : "" ) ] ) ,
                        !columns.includes( 'label-coord' ) ? null : reify( 'td', {}, [ reifyText( `${ point.labelCoord }` ) ] ),
                        !columns.includes( 'coord' ) ? null : reify( 'td', {}, [ reifyText( `(${ point })` ) ] ),
                        !columns.includes( 'perm' ) ? null : reify( 'td', {}, [ reifyText( `${ point.perm }` ) ] ),
                        !columns.includes( 'anti-perm' ) ? null : reify( 'td', {}, [ reifyText(
                            arrayExactlyEquals( point.perm, point.antiPerm )
                            ? ''
                            : `${ point.antiPerm }` ) ] ),
                        !columns.includes( 'bases' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.bases }]` ) ] ),
                        !columns.includes( 'place-values' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.placeValues }]` ) ] ),
                        maybeDisplay( 'inverse', () => reify( 'td', {}, [ reifyText( `${ point.inverse ? point.inverse.label() : '' }` ) ] ) ),
                        !columns.includes( 'i-label-coord' ) ? null : reify( 'td', {}, [ reifyText( `${ point.inverse.labelCoord }` ) ] ),
                        !columns.includes( 'i-coord' ) ? null : reify( 'td', {}, [ reifyText( `(${ point.inverse })` ) ] ),
                        !columns.includes( 'match' ) ? null : reify( 'td', {}, [ reifyText( isInverse( point.labelCoord, point.inverse.labelCoord ) ? '' : '0' ) ] ),
                        !columns.includes( 'monomial' ) ? null : reify( 'td', {}, [ point.cycles.htmlMonomial() ] ),
                        !columns.includes( 'index' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.index }]` ) ] ),
                        !columns.includes( 'deindex' ) ? null : reify( 'td', {}, [ reifyText( `[${ point.deindex }]` ) ] ),
                        !columns.includes( 'i-index' ) ? null : reify( 'td', {}, [ reifyText( `(${ point.inverse.index })` ) ] ),
                        !columns.includes( 'cycles' ) ? null : reify( 'td', {}, [
                            reifyText( point.cycles.identities().map( cycle => `(${ cycle })` ).join('') ),
                            reify( 'br' ),
                            ...point.cycles.orbits().flatMap( cycle => [ reifyText( `(${ cycle })` ), reify( 'br' ) ] ),
                        ] ),
                        maybeDisplay( 'diagram', () => reify( 'td', {}, [ point.cycles.x3dCycles() ] ) ),
                    ]
                )
            )
        ]
    );
}

const actionsHtmlTableSelectedIndex = [ 0 ];
const actionsHtmlTableColumns = [
    'label',
    'alias',
    'match',
    'constants',
    'parity',
    'monomial',
    'per2',
    'rad',
    'volume',
    'order',
];

function cyclesDomNode( actions, caption = null, monomialFilter = null ) {
    const allColumns = [
        'box',
        'alias',
        'label',
        'match',
        'inverse',
        'perms',
        'parity',
        'place-values',
        'constants',
        'monomial',
        'volume',
        'order',
        'id-sum',
        'coords-sum',
        'per2',
        'rad',
        'index',
//        'cycles',
    ];
    const columns = [ '#', ...arrayIntersection( allColumns, actionsHtmlTableColumns ) ];

    const otherLabel = ( source ) => {
        const actions = Box.identifySources( source );
        return actions.length == 0
            ? ''
            : `${ actions.map( action => action.label()).join('=') }`;
    };
    const otherPerm = ( source ) => {
        const actions = Box.identifySources( source );
        return actions.length == 0
            ? ''
            : actions[0].perms();
    };
    const maybeDisplay = (label, domFn) => columns.includes( label ) ? domFn() : null;

    const monomialFilterMatches = ( m1, m2 ) => {
        const k1 = Object.keys( m1 );
        const k2 = Object.keys( m2 );
        if ( k1.length != k2.length ) {
            return false;
        } else {
            return k1.filter( k => m1[k] == m2[k] ).length == k1.length;
        }
    };

    const tableContainer = reify( 'div' );
    const cyclesContainer = reify( 'div' );

    const onRowSelectionFactory = ( rowNo, cycles, source ) => {
        return ( event ) => {
            const classList = source.classList;

            if ( classList.contains( 'selected' ) ) {
                classList.remove( 'selected' );
                if ( cyclesContainer ) {
                    cyclesContainer.innerHTML = '';
                }
                actionsHtmlTableSelectedIndex[0] = 0;
            } else {
                tableContainer
                    .querySelectorAll( '.selected' )
                    .forEach( s => s.classList.remove('selected'));
                classList.add( 'selected' );
                actionsHtmlTableSelectedIndex[0] = rowNo;

                if ( cyclesContainer ) {
                    cyclesContainer.innerHTML = '';
                    cyclesContainer.appendChild( reify( 'hr' ) );
                    cyclesContainer.appendChild( cycles.htmlTable() );
                    x3dom.reload();
                }

                const monomialFilter = document.getElementById('monomialFilter');
                if ( monomialFilter ) {
                    monomialFilter.value = ( JSON.stringify( cycles.monomial() ) );
                    monomialFilterDisplay.innerHTML = '';
                    monomialFilterDisplay.appendChild( cycles.htmlMonomial() );
                }
            }
       };
    };

    const tableRenderer = (actions) => reify(
        'table',
        { 'class': 'box-action' },
        [
            caption ? reify( 'caption',{}, [ reifyText( caption ) ] ) : null,
            reify(
                'tr',
                {},
                [ '#', ...arrayIntersection( allColumns, columns ) ]
                    .map( ( column, i) => reify( 'th', {}, [ reifyText( column ) ], [ c => c.onclick = () => sortTable( c, i ) ] ) )
            ),
            ...actions
                .filter( cycles => !monomialFilter || monomialFilterMatches( cycles.monomial(), monomialFilter ) )
                .map( (cycles, i) => reify(
                    'tr',
                    {
                        'id': `orbit-${ i }`,
                        'class': i == actionsHtmlTableSelectedIndex[0] ? 'default-selection' : ''
                    },
                    [
                        reify( 'td', {}, [ reifyText( `${ i + 1 }` ) ] ),
                        maybeDisplay( 'box', () => reify( 'td', {}, [ reifyText( `[${ cycles.getBases().join(':') }]` ) ] ) ),
                        maybeDisplay( 'alias', () => reify( 'td', {}, [ reifyText( `${ cycles.ref() }` ) ] ) ),
                        maybeDisplay( 'label', () => reify( 'td', {}, [ reifyText( `${ cycles.label() }` ) ] ) ),
                        maybeDisplay( 'match', () => reify( 'td', {}, [ reifyText( otherLabel( cycles ) ) ] ) ),
                        maybeDisplay( 'inverse', () => reify( 'td', {}, [ reifyText( `${ cycles.inverse ? cycles.inverse.label() : '-' }` ) ] ) ),
                        maybeDisplay( 'perms', () => reify( 'td', {}, [ reifyText( `${ cycles.perms() }` ) ] ) ),
                        maybeDisplay( 'parity', () => reify( 'td', {}, [ reifyText( `${ cycles.parity() }` ) ] ) ),
                        maybeDisplay( 'place-values', () => reify( 'td', {}, [ reifyText( `${ cycles.placeValuePair() }` ) ] ) ),
                        maybeDisplay( 'constants', () => reify( 'td', {}, [ reifyText( `[${ cycles.C().join(', ') }]` ) ] ) ),
                        maybeDisplay( 'monomial', () => reify( 'td', {}, [ cycles.htmlMonomial() ] ) ),
                        maybeDisplay( 'volume', () => reify( 'td', {}, [ reifyText( `${ cycles.getVolume() }` ) ] ) ),
                        maybeDisplay( 'order', () => reify( 'td', {}, [ reifyText( `${ cycles.order() }` ) ] ) ),
                        maybeDisplay( 'id-sum', () => reify( 'td', {}, [ reifyText( `${ cycles.getStats().idSum }` ) ] ) ),
                        maybeDisplay( 'coords-sum', () => reify( 'td', {}, [ reifyText( `(${ cycles.getStats().coordsSum })` ) ] ) ),
                        maybeDisplay( 'per2', () => reify( 'td', {}, [ reifyText( `${ cycles.getStats().euclideanPerimeter }` ) ] ) ),
                        maybeDisplay( 'rad', () => reify( 'td', {}, [ reifyText( `${ cycles.getStats().indexPerimeter }` ) ] ) ),
                        maybeDisplay( 'equations', () => reify( 'td', {}, [ cycles.htmlEquations() ] ) ),
                        maybeDisplay( 'index', () => reify( 'td', {}, [ reifyText( `[${ cycles.index }]` ) ] ) ),
                        maybeDisplay( 'cycles', () => reify( 'td', {}, [
                            reifyText( cycles.identities().map( cycle => `(${ cycle })` ).join('') ),
                            reify( 'br' ),
                            ...cycles.orbits().flatMap( cycle => [ reifyText( `(${ cycle })` ), reify( 'br' ) ] ),

                        ] ) ),
                    ],
                    [
                        c => c.onclick = onRowSelectionFactory( i, cycles, c )
                    ]
                )
            )
        ]
    );
    const columnSelectors = allColumns
        .map( (column,i) => reify( 'label', { 'class': 'columnSelector' }, [
            i == 0 ? null : reifyText( '| ' ),
            reifyText( column ),
            reify( 'input', { 'type': 'checkbox', 'checked': ( actionsHtmlTableColumns.includes( column ) ? 'checked' : '' ) }, [], [
                c => c.onchange = () => {
                    if ( !c.checked && actionsHtmlTableColumns.includes( column ) ) {
                        actionsHtmlTableColumns.splice( actionsHtmlTableColumns.indexOf(column), 1 );
                        columns.length = 0;
                        columns.push( '#', ...arrayIntersection( allColumns, actionsHtmlTableColumns ) );
                        tableContainer.innerHTML = '';
                        tableContainer.appendChild( tableRenderer( actions ) );

                    } else if ( c.checked && !actionsHtmlTableColumns.includes( column ) ) {
                        actionsHtmlTableColumns.push( column );
                        columns.length = 0;
                        columns.push( '#', ...arrayIntersection( allColumns, actionsHtmlTableColumns ) );
                        tableContainer.innerHTML = '';
                        tableContainer.appendChild( tableRenderer( actions ) );
                    }
                }
            ] )
        ] ) );
    tableContainer.appendChild( tableRenderer(actions) );
    return reify( 'div', {}, [
        reify('div', {}, [
            reify( 'label', { 'class': 'columnSelector' }, [ reifyText( 'columns: ' ) ] ),
            ...columnSelectors
        ] ),
        tableContainer,
        cyclesContainer
    ]);
}


Box.prototype.cyclesDomNode = function( caption, monomialFilter, cyclesContainer ) {
    return cyclesDomNode( this.actions(), caption ? caption : `Actions of [${ this.odometer.bases }]`, monomialFilter, cyclesContainer );
}

Box.prototype.indexesDomNode = function( actions ) {
    const columns = [ '#', 'label', 'perms', 'place-values', 'monomial', 'index'];

//    actions.sort( (a1, a2) => arrayReverseCompare( a1.label(), a2.label() ) );
    return reify(
        'table',
        { 'class': 'box-action' },
        [
            reify( 'tr', {}, columns.map( column => reify( 'th', {}, [ reifyText( column ) ] ) ) ),
            ...actions.map( (cycles, i) => reify(
                    'tr',
                    {},
                    [
                        reify( 'td', {}, [ reifyText( `${ i }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ cycles.label() }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ cycles.perms() }` ) ] ),
                        reify( 'td', {}, [ reifyText( `${ cycles.placeValuePair() }` ) ] ),
                        reify( 'td', {}, [ cycles.htmlMonomial() ] ),
//                        reify( 'td', {}, [ cycles.stats.idSum ] ),
//                        reify( 'td', {}, [ cycles.stats.coordSum ] ),
//                        reify( 'td', {}, [ cycles.stats.indexPerimeter ] ),
//                        reify( 'td', {}, [ cycles.stats.euclideanPerimeter ] ),
                            reify( 'td', {}, [ reifyText( cycles.index.join(',') ) ] )
                    ]
                )
            )
        ]
    );
}


/*
    columnType = [ 'number', 'fraction', 'product' ]
*/

const sortableColumnTypes = [ 'number', 'fraction', 'product', 'monomial', 'cycles', 'text' ];

function sortTable( column, columnIndex, columnType ) {
    var rows, switching, i, x, y, shouldSwitch;

    if ( columnType && !sortableColumnTypes.includes( columnType ) ) {
        throw new Error( `Unknown column type: ${ columnType }` );
    }

    const getTable = (c) => {
        while ( 'TABLE' != c.tagName && c != null) {
            return getTable(c.parentNode);
        }
        return c;
    };

    const table = getTable(column);

    table
        .dataset
        .sortColumn = columnIndex;

    var th = table.rows[0].getElementsByTagName("TH")[columnIndex];

    // if already ascending then sort descending
    var descending = th.classList.contains( "sort-asc")
    var clear = th.classList.contains( "sort-desc")

    var thc = table.rows[0].getElementsByTagName("TH");
    for (var i = 0; i < thc.length; i++ ) {
        thc[i].classList.remove( "sort-asc");
        thc[i].classList.remove( "sort-desc");
    }

    if (clear) {
        return;
    } else if ( descending ) {
        th.classList.add( "sort-desc");
    } else {
        th.classList.add( "sort-asc");
    }

    switching = true;

    function Fraction( s ) {
        s = s.trim();
        if ( s.startsWith( "(" ) && s.endsWith( ")" ) ) {
            s = s.substring( 1, s.length - 1 );
            s = s.trim();
        }
        const f = s.split( /\s*[\/\|,\*]\s*/ );
        f[0] = Number( f[0].trim() );

        if ( f[0] == 0 ) {
            return 0;
        } else if( f.length == 1 ) {
            return f[0];
        }

        f[1] = Number( f[1].trim() );

        return ( f[0] == f[1] ) ? 1 : ( f[0] / f[1] );
    }

    function Product( s ) {
        s = s.trim();
        if ( s.startsWith( "(" ) && s.endsWith( ")" ) ) {
            s = s.substring( 1, s.length - 1 );
            s = s.trim();
        }
        return s
            .split( /<br[\/]?>/ )
            .map( x => x
                .split( /\s*[\*]\s*/ )
                .map( x => Number( x.trim() ) )
                .reduce( (a,c) => a * c, 1 ) )
            .reduce( (a,c) => a + c, 0 );
    }

    function Cycles( s ) {
        s = s.trim();
        if ( s.startsWith( "(" ) && s.endsWith( ")" ) ) {
            s = s.substring( 1, s.length - 1 );
            s = s.trim();
        }
        return s
            .split( /<br[\/]?>/ )
            .map( x => x
                .split( /\s*[\*]\s*/ )
                .map( x => Number( x.trim() ) )
                .reduce( (a,c) => a * c, 1 ) )
            .reduce( (a,c) => a + c, 0 );
    }


    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
        // Start by saying: no switching is done:
        switching = false;
        rows = table.rows;
        /* Loop through all table rows (except the
        first, which contains table headers): */
        for ( i = 1; i < (rows.length - 1); i++) {
            // Start by saying there should be no switching:
            shouldSwitch = false;
            /* Get the two elements you want to compare,
            one from current row and one from the next: */
            x = rows[i].getElementsByTagName("TD")[columnIndex];
            y = rows[i + 1].getElementsByTagName("TD")[columnIndex];

            if (y && !y.classList.contains("sum-total") ) {
                var xT = x ? x.innerText : null;
                var yT = y ? y.innerText : null;

                if ( xT && yT ) {
                    xT = xT.toLowerCase();
                    yT = yT.toLowerCase();

                    switch( columnType ) {
                        case 'number':
                          var xV = Number( xT );
                          var yV = Number( yT );
                          break;

                        case 'fraction':
                          var xV = Fraction( xT );
                          var yV = Fraction( yT );
                          break;

                        case 'product':
                          var xV = Product( xT );
                          var yV = Product( yT );
                          break;


                        default:
                          var xV = xT;
                          var yV = yT;
                          break;
                    }

                    // Check if the two rows should switch place:
                    if ( descending ? (xV < yV) : (xV > yV)) {
                        // If so, mark as a switch and break the loop:
                        shouldSwitch = true;
                        break;
                    }
                }
            }
        }
        if (shouldSwitch) {
            /* If a switch has been marked, make the switch
            and mark that a switch has been done: */
            rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
            switching = true;
        }
    }
}