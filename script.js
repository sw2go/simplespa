var app = new Router({
    onContentElementInserted: function(element) {

        var count = 0;

        function loaded() {
            count--;
            if (count <= 0) {            
                if (element.querySelector('pre[data-src]')) {
                    window.Prism.fileHighlight();        
                };
            }
        };

        var elements = element.querySelectorAll('script[src]');
        if (elements.length > 0) {
            [].forEach.call(elements, function(element) {
                var src = element.getAttribute("src");
                if (!document.querySelector('head > script[src="' + src +  '"]' )) {
                    var script = document.createElement('script');
                    script.setAttribute('type', 'text/javascript');
                    count++;
                    script.onload = loaded;
                    script.setAttribute('src', src);
                    document.head.appendChild(script);                    
                }            
            });
        }
        else {
            loaded();
        }

            






        





    }
});


function Router(config) {
    
    this.navigateToLink = function (event) {   
        event.preventDefault();
        fetchContent(event.target.pathname, function () {
            history.pushState(null, document.title, event.target.pathname);
            displayContent(event.target.pathname);
        }, function(error){});
    }

    documentReady(function() {
        // browser url-normalization: remove trailing "/" (on sub-pages only)
        if (document.location.pathname.length > 1 &&  endsWith(document.location.pathname,'/')) {
            history.replaceState(null, document.title, document.location.pathname.slice(0,-1));
        }
                
        // insert the current content (based on the url)
        fetchContent(document.location.pathname, function(html){},function(error){});

        HttpGetRequest("/header.html", function(html) {
            document.querySelector('#header').insertAdjacentHTML('beforeend', html);
        }, function(error){});

        HttpGetRequest("/footer.html", function(html) {
            document.querySelector('#footer').insertAdjacentHTML('beforeend', html);
        }, function(error) {});

        window.onpopstate = function() {
            this.fetchContent(document.location.pathname, function() {
                this.displayContent(document.location.pathname);
            }, function(error){});        
        }    
    });

    function fetchContent(path, resolve, reject) {    
        if (document.getElementById(path)) {
            console.log('cache');
            resolve();
        } else {
            fileUrl = endsWith(path,'/') ? "/main.html" : path + '/content.html';
            HttpGetRequest(fileUrl, function(html) {
                console.log("load");
                let content = document.querySelector('#content');
                content.insertAdjacentHTML('beforeend', html);
                content.lastElementChild.id = path;
                if(config.onContentElementInserted) {
                    config.onContentElementInserted(content.lastElementChild);
                }          
                resolve();
            }, function(error) {});            
        }
    }

    function displayContent(path) { // [].forEach for IE
        [].forEach.call(document.querySelector('#content').childNodes,function(node) {
            if (node instanceof Element) {
                node.style.display = 'none';
            }                    
        });  
        document.getElementById(path).style.display = 'block';
    }

    function HttpGetRequest(path, resolve, reject) {
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
    }

    function documentReady(fn) {
        // see if DOM is already available, since IE9 and all chrome, safari etc. 
        if (document.readyState === "complete" || document.readyState === "interactive") {        
            setTimeout(fn, 1);  // call on next available tick
        } else {
            document.addEventListener("DOMContentLoaded", fn);
        }
    } 

    function endsWith(text, match) {    // for IE
        var idx = text.lastIndexOf(match);
        return (idx >=0 && idx === text.length - match.length);    
    }
}