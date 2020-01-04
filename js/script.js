
window.hljs.initHighlightingOnLoad();


var app = new Router({
    onContentElementInserted: function(element) {
        if (element.querySelector('pre[data-src]')) {
            window.Prism.fileHighlight();        
        };
    },
    onMarkdownRender: function(markup) {
        var md = window.markdownit({
            highlight: function(str, lang) {
                var result = window.Prism.highlight(str, window.Prism.languages.javascript, lang);
                console.log(result);
                return result;
                return window.hljs.highlight(lang, str).value;
            }
        });
        return md.render(markup);        
    }
});

/**
 * Simple Client-Side SPA Router (no backend required) 
 * expecting index.html with #header, #content and #footer tags
 * The folder structure represents 1:1 the routes 
 * Each folder must contain at least one file called content.html 
 * @param { { onContentElementInserted: function(Element): void, onMarkdownRender: function(string): string}  } config 
 */
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
            let content = document.querySelector('#content');
            fileUrl = endsWith(path,'/') ? "/content" : path + '/content';
            console.log(fileUrl);
            HttpGetRequest(fileUrl +'.html', function(html) {
                console.log("load html");                
                content.insertAdjacentHTML('beforeend', html);  // according to HTML5 this "insert" does  
                content.lastElementChild.id = path;             // not activate contained script-tags 
                // fetch contained script-tags happens here
                fetchElementScripts(content.lastElementChild, function(el) {
                    if(config.onContentElementInserted) {
                        config.onContentElementInserted(el);
                    }    
                    resolve();
                });
                        
            }, function(error) {
                HttpGetRequest(fileUrl + '.md', function(markdown) {
                    console.log("load md");
                    var html = (config.onMarkdownRender) 
                    ? config.onMarkdownRender(markdown) 
                    : "<p>No Markdown Rederer attached</p>"
                    var div = document.createElement('div');
                    div.insertAdjacentHTML('beforeend', html);
                    div.id = path;
                    content.insertAdjacentElement('beforeend', div);
                    resolve();
                }, function(error){});
            });            
        }
    }

    /**
     * Fetch all script tags within the content element and add them to the head tag if not fetched jet
     * complete is called back when head is updated or already completed an the script-code can be used
     * @param {Element} element 
     * @param {function(Element):void} complete 
     */
    function fetchElementScripts(element, complete) {
        var elementScripts = element.querySelectorAll('script[src]');
        var remaining = elementScripts.length;
        
        function loaded() {
            remaining--;
            if (remaining <= 0) {
                complete(element);
            }
        };
        
        if (elementScripts.length > 0) {
            [].forEach.call(elementScripts, function(script) {
                var src = script.getAttribute("src");
                if (!document.querySelector('head > script[src="' + src +  '"]' )) {        
                    console.log(script);
                    var headChild = document.createElement('script');
                    headChild.setAttribute('type', 'text/javascript');
                    headChild.onload = loaded;
                    headChild.setAttribute('src', src);
                    document.head.appendChild(headChild);                          
                }
                else {
                    loaded();
                }                  
            });
        }
        else {
            loaded();
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