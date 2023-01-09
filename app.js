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
            let element = createElementUI(cursor.result.key, cursor.result.value);
            fragment.appendChild(element);
            cursor.result.continue();
        } else{
            //when there is no more data to add to the fragment
            mytablebody.appendChild(fragment);
        };
    });
};

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
    console.log(IDBData);
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
          
          const td = document.createElement("TD");       
          const _input = document.createElement("INPUT");  
          _input.value= data[value.name]===undefined?"":data[value.name];
          _input.type=value.type;
          _input.placeholder=value.placeholder;
         // _input.setAttribute("spellcheck", "false");
          _input.style.width=value.width;
          td.appendChild(_input);
          tr.appendChild(td);
          _input.addEventListener("change", ()=>{
              let obj = {};           
              obj[value.name] =_input.value;   
              editObject(id, obj)
          });
/*           _input.addEventListener("blur", ()=>{
           //alert("blur");
            isBlured=true;
              let obj = {};           
              obj[value.name] =_input.value;   
              editObject(id, obj)
          }); */
    }  

    return tr
};