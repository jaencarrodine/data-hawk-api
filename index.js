




const nodemailer = require('nodemailer')
const express = require('express')
const app = express()
const port = process.env.PORT || 4500

const bodyParser = require('body-parser');
const fs = require('fs')
const request = require('request')
const https = require('https')
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
require('dotenv/config')
const puppeteer = require('puppeteer')

//connect to mongo db
const assert = require('assert')
const { resolve } = require('path')
const e = require('express')
const mongo = require('mongodb');

const MongoClient = require('mongodb').MongoClient;
const url = process.env.DB_connection
var mongodb
// Create the db connection
MongoClient.connect(url,{  
    poolSize: 10, useUnifiedTopology: true }, function(err, db) {  
    assert.equal(null, err);
    mongodb=db;
    }
);

app.use(bodyParser.json())
app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*"); // disabled for security on local
    res.header("Access-Control-Allow-Headers", "Content-Type");
    next();
})

// nodemailer set up 
let transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.gmailUser,
        pass: process.env.pass
    }
})

//

app.get('/users', async(req, res) =>{
    const DB = await mongodb.db("DataHawkDB").collection('users')
    const users = await DB.find({}).toArray()
    res.send(users)
})



app.post('/check-permissions',async(req,res)=>{
    try{
        const sub = req.body.sub
        const users = await mongodb.db("DataHawkDB").collection('users')
        let permissions = await users.findOne({sub:sub})
        if(permissions === null){
            res.send({userNotFound:true})
        }else{
            res.send(permissions)
        }
        
    }catch(e){
        console.log('error checking permissions',e)
    }
    
})

app.post('/new-user', async(req,res)=>{
    try{
        console.log("adding user")
        const email = req.body.email
        const sub = req.body.sub
        const users = await mongodb.db("DataHawkDB").collection('users')
        let check = await users.findOne({sub:sub}) 
        if(check === null){
            let res = await users.findOneAndUpdate({sub:sub},{$set:{email:email}},{upsert:true})
            console.log(res)
        }
        res.send({})
        

    }catch(e){
        console.log('error creating new user: '+e)
    }
})

app.post('/add-company-admin',async(req,res)=>{
    try{
        const sub = req.body.sub
        const adminEmail = req.body.adminEmail
        const companyId = req.body.companyId
        const users = await mongodb.db("DataHawkDB").collection('users')
        let permissions = await users.findOne({sub:sub})
        //check if user as superAdmin priv 
        if(permissions.superAdmin){
            let admin = await users.findOne({email:adminEmail})
            if(admin === null || admin === undefined){
                res.send({message:'No account with the provided email exists. Please ask admin to create an account then try again'})
            }else if(admin.companyAdmin && (admin.companyId === companyId)){
                res.send({message:"The user with the provided email is already an admin of "+admin.companyId})
            }else if(admin.companyAdmin && (admin.companyId !== companyId)){
                await users.findOneAndUpdate({sub:admin.sub}, {$set:{companyId:companyId, companyAdmin:true}})
                res.send({message:"Company ID updated to "+companyId})
            }else{
                await users.findOneAndUpdate({sub:admin.sub}, {$set:{companyId:companyId, companyAdmin:true}})
                res.send({message:"Success. Company Admin privileges granted to "+adminEmail})
            }
            
        }else{
            res.send({message:'You do not have permission to complete this action'})
        }

        
    }catch(e){
        console.log('error adding company admin: ',e)
    }
    
})

app.post('/add-company-user',async(req,res)=>{
    try{
        const sub = req.body.sub
        const userEmail = req.body.userEmail
        let companyId
        const users = await mongodb.db("DataHawkDB").collection('users')
        let permissions = await users.findOne({sub:sub})
        if(permissions.superAdmin){
            companyId = req.body.companyId
        }else{
            companyId = permissions.companyId 
        }
        //check if user as superAdmin or admin priv 
        if(permissions.superAdmin || permissions.companyAdmin){
            let user = await users.findOne({email:userEmail})
            if(user === null || user === undefined){
                res.send({message:'No account with the provided email exists. Please ask user to create an account then try again'})
            }else if(user.dataAccess === companyId){
                res.send({message:"The user with the provided email address already has access to your company's data"})
            }else{
                await users.findOneAndUpdate({sub:user.sub}, {$set:{dataAccess:companyId}})
                res.send({message:"Success. Data access granted to "+userEmail})
            }
            
        }else{
            res.send({message:'You do not have permission to complete this action'})
        }

        
    }catch(e){
        console.log('error adding company user',e)
    }
    
})

app.post('/get-data',async(req,res)=>{
    try{
        const sub = req.body.sub
        const users = await mongodb.db("DataHawkDB").collection('users')
        const user = await users.findOne({sub:sub})
        
        const userWithData = await users.findOne({companyId:user.dataAccess})
        
        const data = userWithData.data
        let dataList = []
        for(const d in data){
            console.log(d)
            let dl = data[d]
            let name = d
            dataList.push({name:name, data:dl})
        }
        console.log("sending data")
        console.log(dataList)
        if(dataList[0] === undefined){
            res.send({noDataAccess:true})
        }else{
            res.send(dataList)
        }
        
    }catch(e){
        console.log('error in get-data: '+e)
        res.send({noDataAccess:true})
    }
    
})


app.listen(port, () => console.log(`DataHawk API listening at http://localhost:${port}`))