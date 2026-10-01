---
title: Pages status
layout: default
parent: Internal
status: Draft
assignee: FK
---
# Pages status
List of all pages with the status and the initials of the person assigned for next transition (from each page frontmatter).

```mermaid
flowchart LR
 Void -->|Initialization| Draft
 Draft -->|Submit| Submitted
 Submitted -->|Review + | Released
 Submitted  -->|Review -| Draft
 Released -->|Update| Draft
```
<table>
<tr><th>Title</th><th>Status</th><th>Assignee</th></tr>
{% for page in site.pages %}
{% if page.status %}
<tr><td><a href = '{{page.url}}' target = '_blank'>{{page.title}}</a></td>
<td>{{page.status}}</td>
<td>{{page.assignee}}</td></tr>
{% endif %}
{% endfor %}
</table>


