

if ('serviceWorker' in navigator) {
    //navigator.serviceWorker.register('/sw.js');
    //updateViaCache none, meaning the HTTP cache is never consulted.
    navigator.serviceWorker
    .register("/testPWA/sw.js", {updateViaCache: "none", })
    .then((registration) => {
      registration.addEventListener("updatefound", () => {
        // If updatefound is fired, it means that there's a new service worker being installed.
        //console.log(`Value of updateViaCache: ${registration.updateViaCache}`);
      });
    })
    .catch((error) => {
      console.error(`Service worker registration failed: ${error}`);
    });

    //Lyt efter svar message fra SW
    navigator.serviceWorker.addEventListener('message', event => {
        let data=event.data;
        //console.log("Message fra SW",data);
        /* *************** */
        if("cacheVersion" in data){
            document.getElementById("cacheVersion").innerHTML = `Version: ${data.cacheVersion}`;
        }
        /* *************** */
        if("fileNamesInCache" in data){
            console.log("Filer med verionsnummer i cache")
            console.table(data.fileNamesInCache);
            /*   */        
            document.getElementById("fileNamesInCache").innerHTML="";
            
            data.fileNamesInCache.forEach((item, index)=>{
                //console.log(item,index);
                document.getElementById("fileNamesInCache").innerHTML+=`${item[0]} ${item[1]}</br>`;
            }); 
            

            //document.getElementById("fileNamesInCache").innerHTML = `Filenames in cache: ${data.fileNamesInCache}`;
        }
        /* *************** */
        if("isOnline" in data){
            console.log("######################################################");
            console.log(data.isOnline);
            document.getElementById("isOnline").innerHTML = `Is Online confirmed by fetch call to server: ${data.isOnline}`;
        }
    });
    function myFunction(item, index) {
        text += index + ": " + item + "<br>"; 
      }

    const installedMode=document.getElementById("installedMode");
    if(navigator.standalone){
        //console.log("Installed on IOS");
        installedMode.innerHTML="Installed on IOS"
    } else if(matchMedia('(display-mode:standalone)').matches){
        //console.log("Installed on android or desktop");
        installedMode.innerHTML="Installed on android or desktop"
    } else {
        //console.log("Launched from a browser tab");
        installedMode.innerHTML="Launched from a browser tab"
    }


    //Send forspørgelse til SW
    navigator.serviceWorker.ready.then( registration => {
        registration.active.postMessage({
            "getVersion":true
/*             ,
            "getFileNamesInCache":true */
        });       
    });

}

window.addEventListener("DOMContentLoaded" ,async()=>{ 

    //await getAllFromStore(objectStoreName,DisplayList);

 });  

    console.log("DOMContentLoaded");

    let isOnline="onLine" in navigator && navigator.onLine;
    if(isOnline){
        document.getElementById("isProbablyOnline").innerHTML = `Is Probably <span style="color: green">Online</span>`;
    }
    else {
        document.getElementById("isProbablyOnline").innerHTML = `Is Probably <span style="color: red">Offline</span>`;
    }
    tjekOnlineStatusForSure();


window.addEventListener("online",()=>{    
    console.log("ONLINE event");
    document.getElementById("isProbablyOnline").innerHTML = `Is Probably <span style="color: green">Online</span>`;
    tjekOnlineStatusForSure();
});

window.addEventListener("offline",()=>{
    console.log("OFFLINE event");
    document.getElementById("isProbablyOnline").innerHTML = `Is Probably <span style="color: red">Offline</span>`;
    tjekOnlineStatusForSure();
});

//Sender message til SW som tjekker om filen test.png kan hentes fra server
//SW sender message tilbage som fanges af addEventListener 'message'
function tjekOnlineStatusForSure(){
    navigator.serviceWorker.ready.then( registration => {
        registration.active.postMessage({"checkOnline":true});
    });  
}


//getFilenamesInCache
function getFilenamesInCache(){
    navigator.serviceWorker.ready.then( registration => {
        registration.active.postMessage({"getFilenamesInCache":true});
    });  
}



        let db=null;
        let objectStore=null;
         let dbVersion=20;       
        let objectStoreName=`whiskeyStore${dbVersion}`;

        let DBOpenReq=indexedDB.open("WhiskeyDB", dbVersion);
        
        DBOpenReq.addEventListener("error",(err)=>{
            console.warn(err);
        });

        DBOpenReq.addEventListener("success",(ev)=>{
            db=ev.target.result;
            console.log("Succes");
        });

        DBOpenReq.addEventListener("upgradeneeded",(ev)=>{
            //console.log(ev);
            //console.log(ev.oldVersion);
            //console.log(ev.newVersion);
            
            db=ev.target.result;
            let storenames=db.objectStoreNames;
            for (let index = 0; index < storenames.length; index++) {
                const storename = storenames[index];                
                if(storename!=objectStoreName){   
                    db.deleteObjectStore(storename);
                    console.log("Store deleted:",storename);
                } 
            }

            console.log("Upgraded");


            if(!db.objectStoreNames.contains(objectStoreName)){
                objectStore=db.createObjectStore(objectStoreName,{
                    keyPath:"id",
                })

                objectStore.createIndex("createdIDX", "created",{unique:false});
            }
        });


        document.getElementById("btnAdd").addEventListener("click",
            async (event)=> {
                event.preventDefault();

                let whiskey={
                    id:generateUUID(),
                    //id: Math.floor(Math.random() * 10000000000),
                    name: "Test" + Math.floor(Math.random() * 1000),
                    lastupdate: millisecondsSinceEpoch(),
                    created: millisecondsSinceEpoch()
                }

                await addToStore(objectStoreName,whiskey,DisplayItem);    
                await getAllFromStore(objectStoreName,DisplayList);
            }
        );



        document.getElementById("listItems").addEventListener("click", 
        async (event)=> {
            event.preventDefault();

            //console.log("ClickOnListItems",event);

            if(event.target.classList.contains("deleteBtn")){
                var key = event.target.closest("LI").getAttribute("data-key");
                await deleteFromStore(objectStoreName,key,removeItemFromList); 
            }

        }
    );

/*     document.getElementById("btnRefreshCache").addEventListener("click", 
    async (event)=> {
        event.preventDefault();
      
        navigator.serviceWorker.ready.then( registration => {
            registration.active.postMessage({"refreshCache":true});
        });  
    } 
);*/
/* */    
        document.getElementById("btnListFilesInCache").addEventListener("click", 
        async (event)=> {
            event.preventDefault();
            navigator.serviceWorker.ready.then( registration => {
                registration.active.postMessage({"getFileNamesInCache":true});
            });
        }
        );

        document.getElementById("btnGetList").addEventListener("click", 
            async (event)=> {
                event.preventDefault();
                await getAllFromStore(objectStoreName,DisplayList);
            }
        );


        async function removeItemFromList(key){
            let li=document.querySelector(`[data-key="${key}"]`);
            //console.log("LI to remove",li);
            li.remove();
        }


        function DisplayItem(data){
           // console.log(data);
        }


        function DisplayList(data){
           //console.log(data);

           document.getElementById("listItems").innerHTML=data.map((item)=>{
                return `<li data-key=${item.id}> <button class='deleteBtn'>X</button> ${item.created} ${item.name}</li>`
            }).join("\n");
        }


        async function addToStore(storeName,value,callback) {
            const transaction = db.transaction(storeName, "readwrite"); 
            const store = transaction.objectStore(storeName);

            const request = store.add(value);
            
            request.onsuccess = function (event) {
              //console.log("added to the store", { value }, request.result);
              if (callback) {
                callback(value, request.result);
                //callback(event.target.result,{ value }); 
              }
            };
            
            request.onerror = function () {console.warn("Error did not add to store", request.error);};
            transaction.onerror = function (event) {console.warn("transaction failed", event);};
            transaction.oncomplete = function (event) {};
        }

        async function deleteFromStore(storeName,key,callback) {
            const transaction = db.transaction(storeName, "readwrite"); 
            const store = transaction.objectStore(storeName);

            const request = store.delete(key);
            
            request.onsuccess = function (event) {
              if (callback) {
                callback(key);
              }
            };
            
            request.onerror = function () {console.warn("Error did not delete from store", request.error);};
            transaction.onerror = function (event) {console.warn("transaction failed", event);};
            transaction.oncomplete = function (event) {};
        }



        async function getAllFromStore(storeName,callback) {
            const transaction = db.transaction(storeName, "readonly");
            const store = transaction.objectStore(storeName);

            //const request = store.getAll();
            const request = store.index("createdIDX").getAll();

            request.onsuccess = function (event) {
              if (callback) {
                callback(event.target.result); 
              }
            };
            
            request.onerror = function () {console.warn("Error did not read to store", request.error);};          
            transaction.onerror = function (event) {console.warn("transaction failed", event);};
            transaction.oncomplete = function (event) {};
          }


          function generateUUID() { // Public Domain/MIT
            var d = new Date().getTime();//Timestamp
            var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16;//random number between 0 and 16
                if(d > 0){//Use timestamp until depleted
                    r = (d + r)%16 | 0;
                    d = Math.floor(d/16);
                } else {//Use microseconds since page-load if supported
                    r = (d2 + r)%16 | 0;
                    d2 = Math.floor(d2/16);
                }
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
        }

        function millisecondsSinceEpoch(){
            return Math.round(Date.now());
        }



        
        
        
        
        