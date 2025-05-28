# NUVA management processes #
## Organization ##
### Core team ###
The core team is in charge of the day to day update and delivery of the NUVA resources. It enrolls the contributors and reports to the scientific and ethical committee.

Among the core team, system administrators have extended privileges to manage users and tools.
### Scientific and ethical committee ###
The scientific and ethical committee is composed of qualified members mandated by the International Vaccine Codes organization to monitor the action of the core team, ensuring that the principles of accuracy, timeliness, neutrality and equity remain respected.
### Contributors ###
Contributors include occasional contributor, that interact ponctually through the Issues tab of the GitHub repository, and enrolled contributors.

Enrolled contributors are qualified individuals willing to participate in the elaboration of the NUVA resource. They can be:
- contributors to alignments. These are typically experts for a vaccine codification, that will provide the transcription of their codes with the equivalent NUVA code.
- contributors to translations, providing localized texts for labels or descriptions.
### Tooling ###
The tools used to deliver the NUVA contents are:
- This GitHub repository
- The CDN where the last version of the NUVA files are exposed
- The [editing platform]() that allows to propose and validate the NUVA core resources and the alignments with other code systems.
- The [Weblate](https://hosted.weblate.org) translation platform that allows to propose and validate translations.
### Roles and authorizations ###
On the GitHub repository:
- Any authenticated GitHub user can view contents, releases, and post an issue.
- No user can publish directly their contributions, all interventions are done through the platforms.
- System administrators may publish or restructure the contents.

On the editing platform:
- External users have no access.
- Contributors to alignments are granted the right to add, alter or remove alignments for a given set of code systems.
- Core team members have unlimited access, allowing to modify resources and to trigger the release of a version.
- System administrators can only manage the authorizations.
On the Weblate platform:
- Any user can view the translations in all languages.
- Contributors to translation are granted the right to submit or validate translations for a given set of languages.
- Core team members have no specific rights.
- System administrators can only manage the authorizations.
## Managing contributors ##
Both the editing platform and Weblate rely upon GitHub authentication for obtaining the identity of contributors. Alignment contributors are required to activate two-factors authentication on GitHub.

When a potential contributor is identified, typically through a submitted Issue, he can be invited to become a contributor.

If he accepts, his submission will be recorded with his identity, qualifications, potential conflicts of interest, proposed associated code systems or languages.

After approval by the scientific and ethical committee, his GitHub account will be allowed to the editing or translation platform, and associated with the list of relevant code systems or languages. If needed, new code systems or languages will then be created.

Contributors accounts may be deactivated but are never removed.

The list of contributors is reviewed on a yearly basis by the Scientific and Ethical Committee. Idle accounts can be deactivated.

## Release process ##
### Change control ###
The changes brought in the editing platform or the translation platform are published only to the Unit files or the Translation files in the GitHub repository.

Releases are triggered by a core team member, that will:
- view the list of source files that have been changed since last release
- possibly, unselect some of these files, in case of changes that are not stabilized yet (for example when initiating the translations for a new language)
- write a change summary
- generate an intended change note, that gathers the change summary and the detailed changes in all unit files.
- publish the intended change note on the repository as a new Issue.
- The members of the Scientific and Ethical Committee are notified and have a one-week delay to express their opposition to publication, justified by an explanation of how all or part of the intended publication contravenes with the quality and neutrality rules of the terminology. During this delay, any contributor may also raise a concern in the Issue comments.
- In case of such a veto, the core team may perform a partial publication by removing the litigious changes. Otherwise, the full publication will be released one week after the exposure of the intended change note.
### Emergency release ###
In case of emergency situation (see incidents management), the core team may perform an immediate release. In that case the change note is published with a justification for the emergency procedure.
## Incidents management ##
### Detection ###
Incidents can be notified by any GitHub user through the Issues tab.

The issue ticket will be used to track the incident along its processing.
### Qualification ###
A core team member will first qualify the issue as a technical or semantic incident. The processing of technical incidents is not described here. Tickets for issues that are not considered as incidents may be closed at this stage.

A semantic incident can cause codification mistakes in vaccination histories, an incorrect vaccination status assessment for the regarded persons, over or under-vaccinations. Its level is assessed by evaluating:
- An impact, depending upon whether the error could create invalid records (e.g., crossing the labels between two vaccines) or not (an evidently correctable typographic mistake).
- A usage frequency of the faulty concept, that could be for a systematic vaccine or a very occasional one.
The table below gives then the incident level among: neglectable, minor, or major.


| Risk of induced mistake > | Unlikely  	| Possible	  | Probable | 
| ---                       | ---         | ---         | ---      |
| **>= 10% of population**	| Minor	      | Major       | Major    | 
| **>= 1% of population**   | Neglectable | Minor       | Major    |
| **< 1% of population**    | Neglectable | Neglectable | Minor    |

The evaluations and their justifications are recorded in the ticket, as well as the exposure duration (the elapsed time since the faulty resource was published).

### Handling ###
The first handling of the semantic incident consists in restoring the resources to a safe state.

For a neglectable incident, the normal release process is used. 

For a minor or major incident, the proposition and validation are performed by core team members within less than 2 working days, and the release is done using the emergency process.

### Communication ###
All issues, current or past, are visible to all users accessing the GitHub repository. Users may choose to subscribe to notifications on issues.
### Documentation ###
The issue ticket constitutes its documentation. Before it is closed, a root cause analysis cause is attached, including recommendations for technical or organizational enhancements to avoid its reproduction.
### Review ###
Once a year, all incident tickets are reviewed in a meeting between the core team and the Scientific and Ethical Committee. A report on the progress and efficiency of the enhancements is published in the repository.
