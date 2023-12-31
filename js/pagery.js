function includeMenu( menuElementId, pages, pageKey ) {
    const menuElement = document.getElementById( menuElementId );
    if (!menuElement) {
        throw new Error( `No such menu element: ${ menuElementId }` );
    }
    menuElement.innerHTML = '';
    pages
        .forEach( (page, pageNo) => {
            const [ id ] = Object.keys( page );

            const cssClass = (id == pageKey)
                ? [ 'menu', 'selected' ]
                : [ 'menu' ];

            const entryElement = reify(
                "a",
                { class: cssClass },
                [ reifyText( `${ pageNo + 1 } ${ id }` ) ],
                [
                    c => c.onclick = ( event ) => includePages( 'pages', 'errors', page, menuElementId, pages )
                ]
            );
            menuElement.appendChild( entryElement );
        } );
}

function includePages( pagesElementId, errorElementId, page, menuElementId, pages ) {
    const pagesElement = document.getElementById( pagesElementId );
    if (!pagesElement) {
        throw new Error( `No such page element: ${ pagesElementId }` );
    }
    pagesElement.innerHTML = '';

    const errorElement = document.getElementById( errorElementId );
    if (!errorElement) {
        throw new Error( `No such error element: ${ errorElementId }` );
    }
    errorElement.innerHTML = '';

    if (!page) {
        throw new Error( 'page is empty' );
    }
    const tally = Object.keys( page );
    const urlParam = new URLSearchParams( window.location.search );

    if (menuElementId) {
        includeMenu( menuElementId, pages, tally[0] );
    }

    Object
        .entries( page )
        .forEach( entry => {
            const [ id, src ] = entry;

            const entryElement = reify( "div", { id: id } );
            pagesElement.appendChild( entryElement );

            const request = new XMLHttpRequest();

            const includer = () => {
                try {
                    entryElement.innerHTML = request.responseText;
                    const scripts = [];
                    entryElement
                        .querySelectorAll( "script" )
                        .forEach( s => scripts.push( s.textContent ) );
                    // scripts do not run concurrently
                    const pageScope = { id: id, src: src };
                    scripts
                        .filter( s => s.length > 0 )
                        .forEach( ( s, i ) => {
                            try {
                                const scriptLines = [
                                    '"use strict";',
                                    "const [ pageScope, urlParam ] = arguments;",
                                    "try {", s, "} catch ( e ) {",
                                    `  const msg = "Script [${ src }#${ id }#${ i + 1 }]; " + e;`,
                                    "  console.log( msg );",
                                    "  console.trace();",
                                    "  throw new Error( msg, { cause: e } );",
                                    "}",
                                    ];

                                Function( scriptLines.join( "\n" ) )( pageScope, urlParam );
                            } catch ( e ) {
                                errorElement
                                    .appendChild( reify( "div", {}, [], [ c => c.innerHTML = e.toString() ] ) )
                            }
                        } );
                    // replace the content of any marked elements
                    // with the evaluation of the title attribute
                    entryElement
                        .querySelectorAll( ".eval" )
                        .forEach( ( ref, i ) => {
                            try {
                                const t = eval( ref.title );
                                if ( t ) {
                                    ref.innerHTML = t;
                                } else {
                                    throw new Error( "Invalid Object: " + t );
                                }
                            } catch ( e ) {
                                const msg = `Bad Eval [${ src }#${ id }#${ i + 1 }]: title=${ ref.title }; ${ e }`;
                                console.log( msg );
                                ref
                                    .appendChild( reify( "div", { class: "error" }, [], [ c => c.innerHTML = msg ] ) )
                            }
                        } );
                    // append to the content of any marked elements
                    // with the evaluation of the title attribute
                    entryElement
                        .querySelectorAll( ".evalNode" )
                        .forEach( ( ref, i ) => {
                            try {
                                const t = eval( ref.title );
                                if ( t instanceof Element ) {
                                    ref.appendChild( t );
                                } else if ( Array.isArray( t ) && ( t.length > 0 ) && ( t[0] instanceof Element ) ) {
                                    t.forEach( t0 => ref.appendChild( t0 ) );
                                } else {
                                    throw new Error( "Invalid Node: " + t );
                                }
                            } catch ( e ) {
                                const errorDetail = ` ${ e.stack }`;
                                const msg = `Bad Eval Node [${ src }#${ id }#${ i + 1 }]; title=${ ref.title }; ${ e }; ${ errorDetail }`;
                                console.log( msg );
                                ref
                                    .appendChild( reify( "div", { class: "error" }, [], [ c => c.innerHTML = msg ] ) )
                            }
                        } );

                } catch ( e ) {
                    console.log( e );
                    console.trace();
                    errorElement
                        .appendChild( reify( "div", { class: "error" }, [], [ c => c.innerHTML = e.toString() ] ) );
                } finally {
                    tally.pop();
                    if ( tally.length == 0 ) {
                        x3dom.reload();
                    }
                }
            };
            request.addEventListener( "load", includer );
            request.open( "GET", src );
            request.send();
        } );
}