# File commands

The plugin's central adapter dispatches file, Git, transfer, and help commands to
these modules. Each command owns its definition, input adaptation, execution,
and presentation. Shared helpers enforce workspace containment and consistent
navigation. All commands run immediately.

## Local modules

- [commit](commit/README.md)
- [tree](tree/README.md)
- [init](init/README.md)
- [delete](delete/README.md)
- [diff](diff/README.md)
- [shared](shared/README.md)
- [search](search/README.md)
- [edit](edit/README.md)
- [download](download/README.md)
- [history](history/README.md)
- [view](view/README.md)
- [rename](rename/README.md)
- [create](create/README.md)
- [restore](restore/README.md)
- [help](help/README.md)
- [upload](upload/README.md)
