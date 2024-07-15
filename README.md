# Switch-Flow-Auto-Backup
![Screenshot 2024-02-03 at 12 43 36 PM](https://github.com/DaveFemia/Switch-Flow-Auto-Backup/assets/155477639/9d308791-ad85-4df1-a11f-50f669c7117d)

Allows you to backup your Enfocus Switch workflows with a single script. Group heirarchy is maintained and Scripts can be packaged for easier migrations across multiple Switch servers.

## Usage
*Currently* script is triggered by an incoming job. (Can be anything, I'm using a dummy text file to trigger)  Flows will be backed up in desired location and group heirarchy will be maintained. *Currently* trigger input will be output upon success (should be expanded on in further revisions).

New flow backups will only be generated if flows are altered and re-saved (So long as you keep them stored in the same export directory). This is accomplished by checking the version number in the specific flow.xml and comparing it to the version number in the previously exported file name.  Very useful for keeping overhead low and not re-packaging the same unaltered workflow repeatedly

## Properties
![Screenshot 2024-02-03 at 12 42 48 PM](https://github.com/DaveFemia/Switch-Flow-Auto-Backup/assets/155477639/8a27db4c-107a-462e-884b-a461b500b3b5)

**Flow XMLs Directory** - The Enfocus Switch directory where your flow_*.xml's are stored

**FlowsPaneLayout xml** -  File select your FlowsPaneLayout.xml  (This script cross-references your flow.xmls and flowspanelayout.xml to gather pertinent info about your workflows)

**Export Directory** - The location you want your workflow backups to be exported to

**Package Scripts** - Dropdown (Yes/No) if Yes is selected any scripts used in your workflows will be backaged inside the exported workflow. Extremely helpful in instances where a server might suffer critical damage or in instances where you are migrating to a new server.  For local backups in cases where I might accidentally delete a workflow I also store backups without scripts packaged (to save on space) as scripts should be located where they are currently linked.

**Output** - Dropdown list. "Output backups into flow","Save backups to export directory","Both".  Both and Output backups into flow will send backed up flows out the success traffic light path.  This is useful if you would like to backup your workflows off-site. (Both and Output backups into flow will also have hierarchy attached so if you end your flow with an "Archive Hierarchy" configurator your group structure will be maintained. Be sure to set your "subfolder levels" property in Archive Hierarchy to a number larger than the greatest amount of child groups any of your flows contains. Normally I set my subfolder levels to 5 just because my flows are generally not greater than 5 children deep.)


## Thanks
This script is largely influenced by the study conducted by @open-automation in 2014 [Research on Enfocus Switch forums](https://forum.enfocus.com/viewtopic.php?t=1432)

I was able to expand on this study quite a bit due to improvements to the Switch scripting engine which wouldn't have been possibly utilizing the old legacy scripting engine from 2014.  Namely packaging scripts inside exported workflows.

## Future Improvements
- Generating new export jobs per workflow with Private Data for better transparancy. Something like PivateDataKey **FABExport** (Workflow X was exported, Workflow X was not exported because the same version already exists in your exports)
- Traffic light output for better error handling
- Expanding upon workflow packaging (including attached Pitstop actions, preflight profiles, variable sets, etc)
- Cleaning up logging
- Specified workflow exports (based on "Mark Flow" in flows panel or based on flow description)

