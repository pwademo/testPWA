
// Files to cache
const version="1.0.16";
const cacheName = `${version}_static`;
const cacheNames=[cacheName];
const appShellFiles = [
  '/testPWA/',
  '/testPWA/index.html',
  '/testPWA/about.html',
  '/testPWA/navbar.js',  
  '/testPWA/navbar.html',
  '/testPWA/app.js',
  '/testPWA/style.css',
  '/testPWA/manifest.json',
  '/testPWA/icons/icon192.png',
  '/testPWA/icons/icon512.png',
  '/testPWA/favicon.ico'
];


/* self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches
      .open(cacheName)
      .then((cache) =>{
        cache.addAll(appShellFiles)
      }        
      )
  );
}); */
 self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches
      .open(cacheName)
      .then((cache) =>{
        appShellFiles.forEach(
              async file=>{
                const filewithparam= `${file}?x=${version}`;
                console.log(filewithparam);                
                const response = await fetch(filewithparam);//fetch med parm for at omgå http/browser cache
                cache.put(file, response); //put tilbage, men uden parm
              }                     
          )
      }        
      )
  );
});


self.addEventListener('activate', function (event) {
	event.waitUntil(caches.keys().then(function (keys) {
		return Promise.all(keys.filter(function (key) {
			return !cacheNames.includes(key);
		}).map(function (key) {
			return caches.delete(key);
		}));
	}).then(function () {
		return self.clients.claim();
	}));
});


self.addEventListener('message', event => {
  let data=event.data;
  //console.log(`The client sent me a message: ${data}`);

  if("getVersion" in data){
    event.source.postMessage({"cacheVersion": version});
  }

  if("refreshCache" in data){
    event.waitUntil(
      caches      
        .open(cacheName)
        .then(async (cache) =>{
          const random=+ Math.floor(Math.random() * 1000);
          const response = await fetch(`index.html?x=${random}`);//bypass html cache med andom parm
          console.log(`index.html?x=${random}`);
          cache.put("index.html", response); //put tilbage uden parm
          
        }

        )
    )
    
    ;
    event.source.postMessage({"cacheVersion": version});
  }

  if("checkOnline" in data){
    let url="/test.png";//Må ikke lægges i cache
    let req=new Request(url, {method:"HEAD",});
    fetch(req)
      .then(
        response=>{
        console.log("Vi ved med sikkerhed at vi er online da der kommer svar fra serveren");
        event.source.postMessage({"isOnline": true});
        },
        (error)=>{
          console.log("Vi ved med sikkerhed at vi er offline");
          event.source.postMessage({"isOnline": false});
        }    
      )
  }

}); 

// Fetching content using Service Worker
self.addEventListener('fetch', (e) => {
  e.respondWith((async () => {
    //console.log(`Cache version ${version}`);
  
    //console.log(e.request);


    const req = await caches.match(e.request);
    //console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
    if (req) return req; 

    const response = await fetch(e.request);
    /*
    const cache = await caches.open(cacheName);
    console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
    cache.put(e.request, response.clone()); 
    */
    return response; 
  })());
  
});

