export interface ToggleConfig {
  storageKey: string
  scriptName: string
}

export type ToggleConfigs = Record<string, ToggleConfig>

export type StorageData = Record<string, boolean>

export interface ToggleMessage {
  action: "toggleChanged"
  scriptName: string
  value: boolean
}
