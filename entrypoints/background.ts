export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id })

  // Open side panel when extension icon is clicked
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
})
