"use strict";
const xpath = require('xpath');
const { tmpdir } = require('node:os');
// const tmp = require('tmp')
const dom = require('@xmldom/xmldom').DOMParser;
const fs = require('fs/promises');
const mk = require('fs');
const iconv = require('iconv-lite');
const path = require('path');
const archiver = require('archiver');
async function jobArrived(s, flowElement, job) {
    let flowlist = [];
    let flowpane = await flowElement.getPropertyStringValue("FlowPane");
    let outputprop = await flowElement.getPropertyStringValue("Output");
    let flowxmls = await flowElement.getPropertyStringValue("flowxmls");
    let exportder = await flowElement.getPropertyStringValue("exportdir");
    let packages = await flowElement.getPropertyStringValue("packages");
    let dir = await mk.readdirSync(flowxmls);
    let flowpanexml = await fs.readFile(flowpane);
    let flowpanexmlconvert = await iconv.decode(flowpanexml, 'utf-8');
    let flowpanedoc = await new dom().parseFromString(flowpanexmlconvert, 'text/xml');
    for (let i = 0; i < dir.length; i++) {
        let xmlfile = await fs.readFile(flowxmls + "/" + dir[i]);
        let flowxmlconvert = await iconv.decode(xmlfile, 'utf-8');
        let flowdoc = await new dom().parseFromString(flowxmlconvert, 'text/xml');
        let flowid = xpath.select1("//Data/@Id", flowdoc).value;
        let flowversion = xpath.select("//Version", flowdoc)[0].firstChild.data;
        let flowname = xpath.select("//FlowFolder", flowdoc)[0].firstChild.data;
        let object = xpath.select("//ScriptPackagePath", flowdoc);
        let flow = "Flow=" + flowid;
        let query = "//Group[" + flow + "]/@Name";
        let exdir = exportder;
        if (xpath.select1(query, flowpanedoc) != undefined) {
            let nodes = xpath.select1(query, flowpanedoc).value;
            let dirs = [];
            dirs.push(nodes);
            while (nodes != undefined) {
                if (nodes != undefined) {
                    try {
                        let nodes1 = xpath.select1(query + "/../../@Name", flowpanedoc).value;
                        dirs.push(nodes1);
                        query = query + "/../../@Name";
                    }
                    catch (error) {
                        break;
                    }
                }
                else {
                    break;
                }
            }
            for (let i = dirs.length - 1; i >= 0; i--) {
                exdir = exdir + "/" + dirs[i];
            }
            // await job.log(LogLevel.Warning, "Heirarch" + dirs)
        }
        mk.mkdirSync(exdir, { recursive: true });
        let thefile = exdir + "/Flow_" + flowid + "_" + flowname + "_v" + flowversion + ".sflow";
        let tempfile = exdir + "/Flow_" + flowid + "_" + flowname + "_v" + flowversion + ".sflow";
        if (mk.existsSync(thefile)) {
            await job.log(LogLevel.Info, thefile + " Alerady exists, not backing up");
        }
        else {
            for (let i = 0; i < flowversion; i++) {
                if (mk.existsSync(exdir + "/Flow_" + flowid + "_" + flowname + "_v" + i + ".sflow")) {
                    await job.log(LogLevel.Warning, "Deleting old version: Flow_" + flowid + "_" + flowname + "_v" + i + ".sflow");
                    await fs.unlink(exdir + "/Flow_" + flowid + "_" + flowname + "_v" + i + ".sflow");
                }
            }
            // const tempdir = await tmpdir();
            // await job.log(LogLevel.Warning, tempdir)   
            // let tempfile = tempdir.name+"/Flow_" + flowid + "_" + flowname + "_v" + flowversion + ".sflow"
            // let tempfile = tempdir+"\\Flow_" + flowid + "_" + flowname + "_v" + flowversion + ".sflow"
            // const output = await mk.createWriteStream(thefile)
            async function archive() {
                const output = await mk.createWriteStream(tempfile);
                const archive = archiver('zip', {});
                await flowlist.push(thefile);
                await output.on('close', async function () {
                    await job.log(LogLevel.Info, "Archived: " + thefile);
                    // try{
                    // let tmpfilepath = tempfile.replace(/\\/g,"/")
                    // flowlist.push(tmpfilepath)
                    // // let tmpfilepath2 = tmpfilepath.replace("ENFOCU~1", "enfocus0cv")
                    // // await job.log(LogLevel.Warning, "tempdir " + tmpfilepath2)
                    // let subjob = await flowElement.createJob(tmpfilepath)
                    // await subjob.sendToSingle()
                    // mk.unlinkSync(tmpfilepath)
                    // return "success"
                    // }catch(error:any){
                    //     await flowElement.log(LogLevel.Error, error.message + " " + thefile )
                    //     return "error"
                    // }
                });
                output.on('end', async function () {
                    await job.log(LogLevel.Info, "Data Complete");
                });
                await archive.pipe(output);
                let manifest;
                if (packages == "Yes") {
                    let propsets = [];
                    let filename;
                    if (object.length == 0) {
                        propsets = "";
                    }
                    else {
                        for (let i = 0; i < object.length; i++) {
                            let fullPath = object[i].firstChild.data;
                            filename = fullPath.replace(/^.*[\\/]/, '');
                            let intopro = `<PropertySet Plugin="" PropertyType="file" InternalPath="${filename}" Path="${fullPath}"/>`;
                            await archive.file(fullPath, { name: filename });
                            propsets.push(intopro);
                        }
                    }
                    let Propertysets1 = `<PropertySets>${propsets}</PropertySets>`;
                    let Propertysets = Propertysets1.replace(/>,</g, "><");
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
        </Manifest>`;
                }
                else {
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
                // await job.log(LogLevel.Warning, manifest)
                await archive.append(flowxmlconvert, { name: "flow.xml" });
                await archive.append(manifest, { name: "manifest.xml" });
                await archive.finalize();
            }
            let archived = await archive();
            // await job.log(LogLevel.Info, archived)
        }
    }
    // await EnfocusSwitchPrivateDataTag.hierarchy("")
    await job.log(LogLevel.Warning, "Number of Flows: " + flowlist.length + "DIRLENGTH: " + dir.length);
    //"Save backups to export directory""Output backups into flow""Both"
    if (outputprop == "Output backups into flow" || outputprop == "Both") {
        await job.log(LogLevel.Warning, "TEST INSIDE BOTH");
        for (let i = 0; i < flowlist.length; i++) {
            let newlocation = flowlist[i];
            let subjob = await flowElement.createJob(newlocation);
            await subjob.sendToSingle();
            if (outputprop == "Output backups into flow") {
                mk.unlinkSync(newlocation);
            }
        }
    }
    await job.setPrivateData("EnfocusSwitch.hierarchy", "C:/Temp");
    await job.sendToSingle();
}
//# sourceMappingURL=main.js.map