"use strict";
const xpath = require('xpath');
const { tmpdir } = require('node:os');
const dom = require('@xmldom/xmldom').DOMParser;
const fs = require('fs/promises');
const mk = require('fs');
const iconv = require('iconv-lite');
const path = require('path');
const archiver = require('archiver');
async function jobArrived(s, flowElement, job) {
    let flowlist = [];
    let heirarchy = [];
    let thehierarchy;
    // let dirs:any = []
    let flowpane = await flowElement.getPropertyStringValue("FlowPane");
    let outputprop = await flowElement.getPropertyStringValue("Output");
    let flowxmls = await flowElement.getPropertyStringValue("flowxmls");
    let exportder = await flowElement.getPropertyStringValue("exportdir");
    let packages = await flowElement.getPropertyStringValue("packages");
    let dir = await mk.readdirSync(flowxmls);
    let flowpanexml = await fs.readFile(flowpane);
    let flowpanexmlconvert = await iconv.decode(flowpanexml, 'utf-8');
    let flowpanedoc = await new dom().parseFromString(flowpanexmlconvert, 'text/xml');
    let statuserror = "good";
    //loop through flows directory
    for (let i = 0; i < dir.length; i++) {
        async function testflowxml() {
            try {
                let xmlfile = await fs.readFile(flowxmls + "/" + dir[i]);
                let flowxmlconvert = await iconv.decode(xmlfile, 'utf-8');
                let flowdoc = await new dom().parseFromString(flowxmlconvert, 'text/xml');
                let flowid = xpath.select1("//Data/@Id", flowdoc).value;
                return "good";
            }
            catch (error) {
                let status = "failed to read Flow.xml, please confirm you selected the correct flow xmls folder.";
                return status;
            }
        }
        let status = await testflowxml();
        if (status != "good") {
            statuserror = status;
            break;
        }
        let xmlfile = await fs.readFile(flowxmls + "/" + dir[i]);
        let flowxmlconvert = await iconv.decode(xmlfile, 'utf-8');
        let flowdoc = await new dom().parseFromString(flowxmlconvert, 'text/xml');
        let flowid = xpath.select1("//Data/@Id", flowdoc).value;
        let flowversion = xpath.select("//Version", flowdoc)[0].firstChild.data;
        let Switchversionroot = xpath.select1("//Version/@ModifiedBySwitch", flowdoc).value;
        await job.log(LogLevel.Warning, "SwitchVersion: " + Switchversionroot);
        let SwitchVersionArray = Switchversionroot.split(".");
        let SwitchVersionNumber = SwitchVersionArray[0];
        let SwitchVersionUpdateNumber = SwitchVersionArray[1];
        while (SwitchVersionUpdateNumber.length != 3) {
            SwitchVersionUpdateNumber = SwitchVersionUpdateNumber + "0";
        }
        let platform = process.platform;
        let OperatingSystem;
        if (platform == "darwin") {
            OperatingSystem = "Mac";
        }
        else {
            OperatingSystem = "Windows";
        }
        let flowname = xpath.select("//FlowFolder", flowdoc)[0].firstChild.data;
        let object = xpath.select("//ScriptPackagePath", flowdoc);
        let flow = "Flow=" + flowid;
        let query = "//Group[" + flow + "]/@Name";
        let exdir = exportder;
        //archive hierarchy
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
                // thehierarchy = thehierarchy + "," + dirs[i]
                // heirarchy.push(dirs[i])
            }
        }
        if (mk.existsSync(exdir) || outputprop == "Output backups into flow") {
        }
        else {
            mk.mkdirSync(exdir, { recursive: true });
        }
        let thefile, tempfile;
        if (outputprop == "Output backups into flow") {
            thefile = exportder + "/Flow_" + flowid + "_" + flowname + "_v" + flowversion + ".sflow";
            tempfile = exportder + "/Flow_" + flowid + "_" + flowname + "_v" + flowversion + ".sflow";
        }
        else {
            thefile = exdir + "/Flow_" + flowid + "_" + flowname + "_v" + flowversion + ".sflow";
            tempfile = exdir + "/Flow_" + flowid + "_" + flowname + "_v" + flowversion + ".sflow";
        }
        if (mk.existsSync(thefile)) {
            await job.log(LogLevel.Info, thefile + " Already exists, not backing up");
        }
        else {
            for (let i = 0; i < flowversion; i++) {
                if (mk.existsSync(exdir + "/Flow_" + flowid + "_" + flowname + "_v" + i + ".sflow")) {
                    await job.log(LogLevel.Warning, "Deleting old version: Flow_" + flowid + "_" + flowname + "_v" + i + ".sflow");
                    await fs.unlink(exdir + "/Flow_" + flowid + "_" + flowname + "_v" + i + ".sflow");
                }
            }
            heirarchy.push(exdir);
            async function archive() {
                const output = await mk.createWriteStream(tempfile);
                const archive = archiver('zip', {});
                await flowlist.push(thefile);
                // await heirarchy.push(dirs)
                await output.on('close', async function () {
                    await job.log(LogLevel.Info, "Archived: " + thefile);
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
                <ProductInfo>Switch Version ${SwitchVersionNumber}</ProductInfo>
                <ExportFormatVersion>1.0</ExportFormatVersion>
                <FlowFile>flow.xml</FlowFile>
                <SwitchFlavour>Switch</SwitchFlavour>
                <SwitchReleaseVersionNumber>${SwitchVersionNumber}</SwitchReleaseVersionNumber>
                <SwitchReleaseType></SwitchReleaseType>
                <SwitchReleaseTypeNumber>0</SwitchReleaseTypeNumber>
                <SwitchUpdateVersionNumber>${SwitchVersionUpdateNumber}</SwitchUpdateVersionNumber>
                <OperatingSystem>${OperatingSystem}</OperatingSystem>
                ${Propertysets}
                </Manifest>`;
                }
                else {
                    manifest = `<Manifest>
                <ProductInfo>Switch Version ${SwitchVersionNumber}</ProductInfo>
                <ExportFormatVersion>1.0</ExportFormatVersion>
                <FlowFile>flow.xml</FlowFile>
                <SwitchFlavour>Switch</SwitchFlavour>
                <SwitchReleaseVersionNumber>${SwitchVersionNumber}</SwitchReleaseVersionNumber>
                <SwitchReleaseType></SwitchReleaseType>
                <SwitchReleaseTypeNumber>0</SwitchReleaseTypeNumber>
                <SwitchUpdateVersionNumber>${SwitchVersionUpdateNumber}</SwitchUpdateVersionNumber>
                <OperatingSystem>${OperatingSystem}</OperatingSystem>
                </Manifest>`;
                }
                await archive.append(flowxmlconvert, { name: "flow.xml" });
                await archive.append(manifest, { name: "manifest.xml" });
                await archive.finalize();
            }
            let archived = await archive();
        }
    }
    if (statuserror == "good") {
        await job.log(LogLevel.Warning, "Number of Flows: " + flowlist.length + "DIRLENGTH: " + dir.length);
        //"Save backups to export directory""Output backups into flow""Both"
        await job.log(LogLevel.Warning, "OUTPUT PROP " + outputprop);
        if (outputprop == "Both" || outputprop == "Output backups into flow") {
            await job.log(LogLevel.Warning, "TEST INSIDE BOTH");
            for (let i = 0; i < flowlist.length; i++) {
                let newlocation = flowlist[i];
                let subjob = await flowElement.createJob(newlocation);
                //remove exportder
                let heirarchyremoveexportder = heirarchy[i].replace(exportder + "/", "");
                let heirarchyreplaceslasharray, heirarchyreplaceslash;
                if (heirarchyremoveexportder == exportder) {
                    heirarchyreplaceslash = "";
                }
                else {
                    heirarchyreplaceslasharray = heirarchyremoveexportder.replace(/\//g, ";");
                    heirarchyreplaceslash = heirarchyreplaceslasharray.split(";");
                }
                await job.log(LogLevel.Warning, "HIERARCHY: " + heirarchyreplaceslash);
                await subjob.setPrivateData("EnfocusSwitch.hierarchy", heirarchyreplaceslash);
                // await subjob.sendToSingle()
                await subjob.sendToData(Connection.Level.Success);
                if (outputprop == "Output backups into flow") {
                    mk.unlinkSync(newlocation);
                }
                await job.sendToNull();
            }
        }
    }
    else {
        await job.log(LogLevel.Error, statuserror);
        await job.sendToData(Connection.Level.Error);
    }
    // await job.setPrivateData("EnfocusSwitch.hierarchy", "C:/Temp")
    // await job.sendToNull()
}
//# sourceMappingURL=main.js.map