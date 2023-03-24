"use strict";

const mytablebody = document.querySelector(".tablebody");
const mytablehead = document.querySelector(".tablehead");
const storeName="myStore";
const dbName="myDb";
const dbVersion=1;



const mySchema=[
    {
        name: "firstname",
        displayname:"First Name",
        value:"",
        type: "text",
        placeholder:"First name",
        width:"100px"
    },
    {
        name: "lastname",
        displayname:"Last Name",
        value:"",
        type: "text",
        placeholder:"Last name",
        width:"140px"
    },
    {
        name: "address",
        displayname:"Address",
        value:"",
        type: "text",
        placeholder:"address",
        width:"300px"
    },
    {
        name: "age",
        displayname:"Age",
        value:"25",
        type: "number",
        placeholder:"Age",
        width:"60px"
    },
    {
        name: "color",
        displayname:"Color",
        value:"#ff00ff",
        type: "color",
        placeholder:"Select color",
        width:"30px"
    },
    {
        name: "date",
        displayname:"Date",
        value:"",
        type: "date",
        placeholder:"Select date",
        width:"120px"
    },
    {
        name: "month",
        displayname:"Month",
        value:"",
        type: "month",
        placeholder:"Select month",
        width:"120px"
    },
    {
        name: "picture",
        displayname:"Picture",
        value:"",
        type: "file",
        placeholder:"Select file",
        width:"520px"
    }
]

const IDBRequest = indexedDB.open(dbName, dbVersion);
IDBRequest.addEventListener("upgradeneeded", ()=>{
    const db = IDBRequest.result;
    db.createObjectStore(storeName, {
        autoIncrement: true
    });
});

IDBRequest.addEventListener("success", ()=>{
    readObject();
});

IDBRequest.addEventListener("error", (err)=>{
    console.error("Error:", err);
});

/* let isBlured=false; */
/* window.addEventListener("beforeunload", function(event) {

    console.log("IsBlurred",isBlured);
    console.log(event);
    event.returnValue = "Write something clever here..";
  }); */

document.getElementById("btn_add").addEventListener("click", ()=>{      
    let newObj={};
    let obj=mySchema.map((item)=>{
           newObj[item.name]=item.value;
    } );
    addObject(newObj);
    readObject();
});


document.getElementById("btn_zip").addEventListener("click", ()=>{      
      const _tmp=makeZip();
      console.log(_tmp);
});




const addObject = (object)=>{
    const IDBData = getIDBData("readwrite");
    IDBData.store.add(object);
    IDBData.transaction.addEventListener("complete", ()=>{
        console.log("Object added");
    });
};

const readObject = ()=>{
    const IDBData = getIDBData("readonly");
    IDBData.store.openCursor();
    IDBData.transaction.addEventListener("complete", ()=>{
        console.log("Object added");
    });

    const cursor = IDBData.store.openCursor(null, 'prev');
    const fragment = document.createDocumentFragment();

    mytablehead.innerHTML = "";
    let headrow=createElementTableHead();
    mytablehead.appendChild(headrow);

    mytablebody.innerHTML = "";

    cursor.addEventListener("success", ()=>{


        if(cursor.result){
            const _pic=cursor.result.value["picture"];
            console.log("Pic",_pic);

            let element = createElementUI(cursor.result.key, cursor.result.value);
            fragment.appendChild(element);
            cursor.result.continue();
        } else{
            //when there is no more data to add to the fragment
            mytablebody.appendChild(fragment);
        };
    });
};


const makeZip = ()=>{
    const IDBData = getIDBData("readonly");
    IDBData.store.openCursor();
    IDBData.transaction.addEventListener("complete", ()=>{
        console.log("Object added");
    });

    const cursor = IDBData.store.openCursor(null, 'prev');

    const zip=new JSZip();

    //const fragment = document.createDocumentFragment();

    //mytablehead.innerHTML = "";
    //let headrow=createElementTableHead();
    //mytablehead.appendChild(headrow);

    //mytablebody.innerHTML = "";

    cursor.addEventListener("success",async ()=>{


        if(cursor.result){
            const _base64=cursor.result.value["picture"];
            const _filename=`picture${cursor.result.key}.jpeg`;
            console.log("_base64",_base64);
            const _blob=convertBase64ToBlob(_base64);
            console.log(_blob);
            zip.file(_filename,_blob);

/*             let element = createElementUI(cursor.result.key, cursor.result.value);
            fragment.appendChild(element); */
            cursor.result.continue();
        } else{
            //when there is no more data to add to the fragment
            //mytablebody.appendChild(fragment);

            const zipfile=await zip.generateAsync({type:'blob'});
            console.log("zipfile",zipfile);
            downloadZip(zipfile);
        };
    });
};



function downloadZip(file){
    const a=document.createElement("a");
    a.download="test.zip";

    const url=URL.createObjectURL(file);
    a.href=url;

    a.style.display="none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}   


const editObject = (key, fieldData)=>{
    const IDBData = getIDBData("readwrite");
    
    const requestOldRecord= IDBData.store.get(key);
    requestOldRecord.onsuccess = (event) => {
        const OldRecord = requestOldRecord.result;
        const NewRecord=Object.assign(OldRecord,fieldData);//update record with the new field value

        //update with new data
        IDBData.store.put(NewRecord, key);
        IDBData.transaction.addEventListener("complete", ()=>{
            console.log("Record modified");
          
        });

    };  
};

const deleteObject = (key)=>{
    console.log("Key",key);
    const IDBData = getIDBData("readwrite");
    IDBData.store.delete(key);
    IDBData.transaction.addEventListener("complete", ()=>{
        console.log("Object deleted");
    });
};


const getIDBData = (mode)=>{
    const db = IDBRequest.result;
    const IDBtransaction = db.transaction(storeName, mode);
    const objectStore = IDBtransaction.objectStore(storeName);
    let IDBData={};
    IDBData["store"]=objectStore;
    IDBData["transaction"]=IDBtransaction;
    console.log("IDBData",IDBData);
    return IDBData;
};


const createElementTableHead = ()=>{
    const tr = document.createElement("TR");
    const th = document.createElement("TH");
    tr.appendChild(th);

    for (const [key, value] of Object.entries(mySchema)) {         
        const th = document.createElement("TH");       
        th.textContent =value.displayname;
        tr.appendChild(th);
    }  
    return tr;
}

//convert file to base64
const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);

        fileReader.onload = () => {
            resolve(fileReader.result);
        };

        fileReader.onerror = (error) => {
            reject(error);
        };
    });
};


//remove data:image part from a base64 string
const stripBase64=(base64)=>{
    return base64.replace(/^data:image\/[a-z]+;base64,/, "");
}

const convertBase64ToBlob=(base64Data)=>{
    //console.log(base64Data);


    //base64Data="iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAHFJREFUWIXt1jsKgDAQRdF7xY25cpcWC60kioI6Fm/ahHBCMh+BRmGMnAgEWnvPpzK8dvrFCCCAcoD8og4c5Lr6WB3Q3l1TBwLYPuF3YS1gn1HphgEEEABcKERrGy0E3B0HFJg7C1N/f/kTBBBA+Vi+AMkgFEvBPD17AAAAAElFTkSuQmCC"
    
    const byteCharacters = atob(stripBase64(base64Data));
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {type: 'image/jpeg'});
    return blob;
}


const uploadImage = async (event) => {
    const file = event.target.files[0];
    const base64 = await convertBase64(file);
    //console.log(base64);
    return base64;
/*     avatar.src = base64;
    textArea.innerText = base64; */
};

const createElementUI = (id, data)=>{
    //tr table row
    const tr = document.createElement("TR");

    //delete button    
    const td = document.createElement("TD");
    const deleteBtn = document.createElement("BUTTON");    
    deleteBtn.classList.add("btn_delete");
    deleteBtn.textContent = "X";
    deleteBtn.setAttribute("title","Delete");
    td.appendChild(deleteBtn);
    tr.appendChild(td);
    deleteBtn.addEventListener("click", ()=>{
        deleteObject(id);
        mytablebody.removeChild(tr);
    });

   //append fields from schema
   for (const [key, value] of Object.entries(mySchema)) {         
          console.log(value.type);



          const td = document.createElement("TD");       
          const _input = document.createElement("INPUT"); 
          
          const valuefromdb=data[value.name]===undefined?"":data[value.name];
          _input.value= valuefromdb;
          _input.type=value.type;
          _input.placeholder=value.placeholder;
         // _input.setAttribute("spellcheck", "false");
          _input.style.width=value.width;
          td.appendChild(_input);
          tr.appendChild(td);

          if(value.type==="file" ){
            td.style.display="inline-flex";
            _input.style.display="none";//hide file input button
            const btn= document.createElement("BUTTON");
            btn.type="button";
            btn.classList.add("btn_img");
            btn.innerText="Upload img";
            btn.addEventListener("click",()=>{
                _input.click();
            });
            const img0 = document.createElement("IMG");    
            img0.width=120;
            img0.src=valuefromdb;
            td.appendChild(btn);
            td.appendChild(img0); 
          } 

          _input.addEventListener("change",async (e)=>{              
              let obj = {};      
              if(e.target.type==="file")
              {
                const base64=await uploadImage(e); 
                obj[value.name] =base64;
                //remove img-tag from UI if img-tag alraedy exist
                const imgexisting=td.querySelector("IMG");
                if(imgexisting){imgexisting.remove();}

                const img = document.createElement("IMG");    
                img.width=120;
                img.src=base64;
                td.appendChild(img); 
                
              } 
              else {
              obj[value.name] =_input.value;   
              } 

              editObject(id, obj)
          });

    }  

    return tr
};