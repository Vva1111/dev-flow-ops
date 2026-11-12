type WorkspaceManifest = {
  name?: unknown
}

const manifests = import.meta.glob<WorkspaceManifest>('../../../*/package.json', {
  eager: true,
  import: 'default',
})

export const applications = Object.values(manifests).flatMap((manifest) => {
  if (typeof manifest.name !== 'string' || !manifest.name.trim()) return []
  const name = manifest.name.split('/').at(-1)
  if (!name) return []

  return [{
    id: manifest.name,
    name,
    workspace: manifest.name,
    kind: name.endsWith('-web') ? 'apps.kind.web' : name.endsWith('-server') ? 'apps.kind.server' : 'apps.kind.other',
  }]
}).sort((a, b) => a.id.localeCompare(b.id, 'en'))
