# Switch-Flow-Auto-Backup
![Screenshot 2024-02-03 at 12 43 36 PM](https://github.com/DaveFemia/Switch-Flow-Auto-Backup/assets/155477639/9d308791-ad85-4df1-a11f-50f669c7117d)

Allows you to backup your Enfocus Switch workflows with a single script. Group heirarchy is maintained and Scripts can be packaged for easier migrations across multiple Switch servers.

## Usage
*Currently* script is triggered by an incoming job. (Can be anything, I'm using a dummy text file to trigger)  Flows will be backed up in desired location and group heirarchy will be maintained. 

New flow backups will only be generated if flows are altered and re-saved (So long as you keep them stored in the same export directory). This is accomplished by checking the version number in the specific flow.xml and comparing it to the version number in the previously exported file name.  Very useful for keeping overhead low and not re-packaging the same unaltered workflow repeatedly.  This feature also breaks if you select output property "Output backups into flow" as no workflows will be stored permanently in the export directory. The script will have no way of knowing what flow versions have been updated since the last run, so every time all flows will be output.

**Note**
I have added a packaged version of the script, if you would like to test out without having to download the whole source project feel free to grab that version.

## Properties
![Screenshot 2024-07-14 at 8 45 41 PM](https://github.com/user-attachments/assets/b24992cb-86e2-4c5b-9a82-4e3fad5deee5)

**Flow XMLs Directory** - The Enfocus Switch directory where your flow_*.xml's are stored

**FlowsPaneLayout xml** -  File select your FlowsPaneLayout.xml  (This script cross-references your flow.xmls and flowspanelayout.xml to gather pertinent info about your workflows)

**Export Directory** - The location you want your workflow backups to be exported to

**Package Scripts** - Dropdown (Yes/No) if Yes is selected any scripts used in your workflows will be backaged inside the exported workflow. Extremely helpful in instances where a server might suffer critical damage or in instances where you are migrating to a new server.  For local backups in cases where I might accidentally delete a workflow I also store backups without scripts packaged (to save on space) as scripts should be located where they are currently linked.
  **Update** - Selecting "Yes" will also package any associated Pitstop Server Actions, Variable Sets, Preflight Profiles and Property Sets. This update should enable you the full ability to store backups     offsite and import them on a different server without having to separately backup scripts/and pitstop server elements seperately.

**Output** - Dropdown list. "Output backups into flow","Save backups to export directory","Both".  Both and Output backups into flow will send backed up flows out the success traffic light path.  This is useful if you would like to backup your workflows off-site. (Both and Output backups into flow will also have hierarchy attached so if you end your flow with an "Archive Hierarchy" configurator your group structure will be maintained. Be sure to set your "subfolder levels" property in Archive Hierarchy to a number larger than the greatest amount of child groups any of your flows contains. Normally I set my subfolder levels to 5 just because my flows are generally not greater than 5 children deep.)
![Screenshot 2024-07-14 at 8 43 48 PM](https://github.com/user-attachments/assets/450d61f3-0af7-4d88-b7e1-b9e4ba208263)


## Thanks
This script is largely influenced by the study conducted by @open-automation in 2014 [Research on Enfocus Switch forums](https://forum.enfocus.com/viewtopic.php?t=1432)

I was able to expand on this study quite a bit due to improvements to the Switch scripting engine which wouldn't have been possibly utilizing the old legacy scripting engine from 2014.  Namely packaging scripts inside exported workflows.

## Future Improvements
- Specified workflow exports (based on "Mark Flow" in flows panel or based on flow description)

