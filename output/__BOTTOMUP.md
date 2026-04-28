---
direct_hash: aae5a71db7cd42382ef749f87ca847684d9d4a517cc8235f53ea31bd492c3577
subtree_hash: 7f736272f2dab1f269ec2c23ab3720afb38db4a2805584798f1966d0b70b938e
enriched: true
enriched_summary_hash: 7de4cb4e9692c3afc7619ba8286bbe45f67197922e901eeb731fa5481b11d1ad
enriched_version: 1
files:
children:
  message: 83106fc0c75b3a94bcbf2bfea53d7e4370c1f7c6e54b9a227f37a57b911c981a
---
# output

## Purpose
Output layer for the file plugin’s generic command responses. It defines the shared structured representation used for non-specialized output—especially tone-aware message responses—that sibling renderer code later turns into CLI text, while richer tree/view/diff flows bypass this path with dedicated WebNode renderers.

## Subdirectories
- `message/` - Message representation layer for standard non-specialized command responses, with tone-aware structured data used by adapters across the plugin before the shared text-rendering path converts it to plain output.
