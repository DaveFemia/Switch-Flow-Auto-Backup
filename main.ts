const xpath = require('xpath')
const dom = require('@xmldom/xmldom').DOMParser
const fs = require('fs/promises')
const mk = require('fs')
const iconv = require('iconv-lite')
const path = require('path')
const archiver = require('archiver')
async function jobArrived(s: Switch, flowElement: FlowElement, job: Job) {
    let flowpane:any = await flowElement.getPropertyStringValue("FlowPane")
    let flowxmls:any = await flowElement.getPropertyStringValue("flowxmls")
    let exportder:any = await flowElement.getPropertyStringValue("exportdir")
    let packages:any = await flowElement.getPropertyStringValue("packages")
    let dir:any = await mk.readdirSync(flowxmls)
    let flowpanexml = await fs.readFile(flowpane)
    let flowpanexmlconvert = await iconv.decode(flowpanexml, 'utf-8')
    let flowpanedoc = await new dom().parseFromString(flowpanexmlconvert, 'text/xml')
for (let i = 0;i<dir.length;i++){
    let xmlfile:any = await fs.readFile(flowxmls + "/" + dir[i])
    let flowxmlconvert:any = await iconv.decode(xmlfile, 'utf-8')
    let flowdoc:any = await new dom().parseFromString(flowxmlconvert, 'text/xml')
    let flowid = xpath.select1("//Data/@Id", flowdoc).value
    let flowversion = xpath.select("//Version", flowdoc)[0].firstChild.data
    let flowname = xpath.select("//FlowFolder", flowdoc)[0].firstChild.data
    let object = xpath.select("//ScriptPackagePath", flowdoc)
    let flow = "Flow=" + flowid
    let query = "//Group[" + flow + "]/@Name"
    let exdir:any = exportder
    if (xpath.select1(query, flowpanedoc) != undefined){
        let nodes = xpath.select1(query, flowpanedoc).value
        let dirs:any = []
        dirs.push(nodes)    
        for (let i=0; i<100;i++){
            if (nodes != undefined){
            try{
                let nodes1 = xpath.select1(query+"/../../@Name", flowpanedoc).value
                dirs.push(nodes1)
                query = query + "/../../@Name"
            }catch(error){
                break;
            }
            }else{
                break;
            }
        }
        for (let i = dirs.length-1;i>=0;i--){
            exdir = exdir + "/" + dirs[i]
        }
    }
mk.mkdirSync(exdir, {recursive:true})
let thefile = exdir+"/Flow_" + flowid + "_" + flowname + "_v" + flowversion + ".sflow"
if(mk.existsSync(thefile)){
    await job.log(LogLevel.Info, thefile + " Alerady exists, not backing up")
}else{
    for(let i = 0;i<flowversion;i++){
        if(mk.existsSync(exdir+"/Flow_" + flowid + "_" + flowname + "_v" + i+ ".sflow")){
        await job.log(LogLevel.Warning, "Deleting old version: Flow_" + flowid + "_" + flowname + "_v" + i+ ".sflow")
        await fs.unlink(exdir+"/Flow_" + flowid + "_" + flowname + "_v" + i+ ".sflow")
        }
    }   
    const output = await mk.createWriteStream(thefile)
    const archive = archiver('zip', {})
    output.on('close', async function() {
        await job.log(LogLevel.Info, "Archived: " + thefile)
    })
    output.on('end', async function() {
        await job.log(LogLevel.Info, "Data Complete")
    })
    await archive.pipe(output)
    let manifest:any
    if(packages == "Yes"){
        let propsets:any = []
        let filename
            if (object.length == 0){
                propsets = ""
            }else{
                for (let i = 0; i < object.length; i++){
                    let fullPath = object[i].firstChild.data
                    filename = fullPath.replace(/^.*[\\/]/,'')
                    let intopro = `<PropertySet Plugin="" PropertyType="file" InternalPath="${filename}" Path="${fullPath}"/>`
                    await archive.file(fullPath, {name: filename})
                    propsets.push(intopro)
                }
            }
        let Propertysets1 = `<PropertySets>${propsets}</PropertySets>`
        let Propertysets = Propertysets1.replace(/>,</g,"><")
        manifest = `<Manifest>
        <ProductInfo>Switch Version 23</ProductInfo>
        <ExportFormatVersion>1.0</ExportFormatVersion>
        <FlowFile>flow.xml</FlowFile>
        <SwitchFlavour>Switch</SwitchFlavour>
        <SwitchReleaseVersionNumber>23</SwitchReleaseVersionNumber>
        <SwitchReleaseType></SwitchReleaseType>
        <SwitchReleaseTypeNumber>0</SwitchReleaseTypeNumber>
        <SwitchUpdateVersionNumber>100</SwitchUpdateVersionNumber>
        <OperatingSystem>Windows</OperatingSystem>
        ${Propertysets}
        </Manifest>`
    }else{
        manifest = `<Manifest>
        <ProductInfo>Switch Version 23</ProductInfo>
        <ExportFormatVersion>1.0</ExportFormatVersion>
        <FlowFile>flow.xml</FlowFile>
        <SwitchFlavour>Switch</SwitchFlavour>
        <SwitchReleaseVersionNumber>23</SwitchReleaseVersionNumber>
        <SwitchReleaseType></SwitchReleaseType>
        <SwitchReleaseTypeNumber>0</SwitchReleaseTypeNumber>
        <SwitchUpdateVersionNumber>100</SwitchUpdateVersionNumber>
        <OperatingSystem>Windows</OperatingSystem>
        </Manifest>`;
    }
    await job.log(LogLevel.Warning, manifest)
    await archive.append(flowxmlconvert, {name:"flow.xml"})
    await archive.append(manifest,{name:"manifest.xml"})
    await archive.finalize();
}}
await job.sendToSingle();
}


