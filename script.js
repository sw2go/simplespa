documentReady(function() {

    HttpGetRequest("/header.html").then(function(fetchedHtml) {

        // normalize browsers location, "/", "/contact", "/blog/blog1"
        if (document.location.pathname.length > 1 &&  document.location.pathname.endsWith('/')) {
            history.replaceState(null, "bla", document.location.pathname.slice(0,-1));
        }
        // insert Header
        document.querySelector('#header').insertAdjacentHTML('beforeend', fetchedHtml);

        // insert the current content
        fetchContent(document.location.pathname);

        HttpGetRequest("/footer.html").then(function(html) {
            document.querySelector('#footer').insertAdjacentHTML('beforeend', html);
        })
    });

    window.onpopstate = function() {
        this.fetchContent(document.location.pathname).then(function() {
            this.displayContent(document.location.pathname);
        });        
    }    
});

function fetchContent(path) {
    return new Promise(function(resolve, reject) {
        if (document.getElementById(path)) {
            console.log('cache');
            resolve();
        } else {
            fileUrl = path.endsWith('/') ? "/main.html" : path + '/content.html';
            HttpGetRequest(fileUrl).then(function(html) {
                console.log("load");
                let content = document.querySelector('#content');
                content.insertAdjacentHTML('beforeend', html);
                content.lastElementChild.id = path;
                resolve();
            });            
        }
    });
}

function navigateToLink(event) {   
    event.preventDefault();
    fetchContent(event.target.pathname).then(function () {
        history.pushState(null, event.target.text, event.target.pathname);
        displayContent(event.target.pathname);
    });
}

function displayContent(path) { // [].forEach for IE
    [].forEach.call(document.querySelector('#content').childNodes,function(node) {
        if (node instanceof Element) {
            node.style.display = 'none';
        }                    
    });  
    document.getElementById(path).style.display = 'block';
}

function HttpGetRequest(path) {
    return new Promise(function(resolve, reject){
        var request = new XMLHttpRequest();
        request.open('GET', path, true); 
        request.onload = function() {
            if (request.status >= 200 && request.status < 400) {
                resolve(request.responseText);
            } else {
                reject(request.status + " " + request.statusText);
            }
          };
        request.send();
    });
}

function documentReady(fn) {
    // see if DOM is already available, since IE9 and all chrome, safari etc. 
    if (document.readyState === "complete" || document.readyState === "interactive") {
        // call on next available tick
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
} 

