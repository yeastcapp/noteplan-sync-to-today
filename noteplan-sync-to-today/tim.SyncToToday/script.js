/* global Editor, DataStore, CommandBar */
// Sync to Today: /st on a task puts a synced copy in today's note (placement set in plugin settings).
// A synced line is the same line carrying the same ^blockID in two notes.
// This command never moves or deletes anything.

var TASK_TYPES = ['open', 'checklist', 'scheduled']

function pad(n) {
  return (n < 10 ? '0' : '') + n
}

function randomId() {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  var id = ''
  for (var i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length))
  return id
}

// The ^id at the end of a line, if there is one.
function getBlockId(para) {
  if (!para) return ''
  if (para.blockId) return String(para.blockId).replace(/^\^/, '')
  var raw = para.rawContent || para.content || ''
  var m = /\s\^([A-Za-z0-9]{6})\s*$/.exec(raw)
  return m ? m[1] : ''
}

function todayNote() {
  var now = new Date()
  var note = null
  try {
    note = DataStore.calendarNoteByDate(now, 'day')
  } catch (e) {
    console.log('calendarNoteByDate failed: ' + e)
  }
  if (!note) {
    try {
      note = DataStore.calendarNoteByDateString(now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()))
    } catch (e2) {
      console.log('calendarNoteByDateString failed: ' + e2)
    }
  }
  return note || null
}

// Make sure the paragraph has a block ID, and return it.
function ensureBlockId(note, para) {
  var id = getBlockId(para)
  if (id) return id

  // 1. Ask NotePlan to add one (the normal route).
  try {
    note.addBlockID(para)
    note.updateParagraph(para)
  } catch (e) {
    console.log('addBlockID failed, will add one by hand: ' + e)
  }
  id = getBlockId(para)
  if (!id) id = getBlockId(note.paragraphs[para.lineIndex])
  if (id) return id

  // 2. Fallback: write an ID onto the line ourselves.
  id = randomId()
  para.content = para.content + ' ^' + id
  note.updateParagraph(para)
  return id
}

function findByBlockId(note, id) {
  var paras = note.paragraphs || []
  for (var i = 0; i < paras.length; i++) {
    if (getBlockId(paras[i]) === id) return paras[i]
  }
  return null
}

// Settings: position and heading name.
function getSettings() {
  var pos = 'top'
  var heading = 'Done'
  try {
    var st = DataStore.settings || {}
    var p = String(st.position || '').trim().toLowerCase()
    if (['above heading', 'under heading', 'top', 'bottom'].indexOf(p) !== -1) pos = p
    if (st.heading && String(st.heading).trim()) heading = String(st.heading).trim()
  } catch (e) {
    console.log('could not read settings, using defaults: ' + e)
  }
  return { position: pos, heading: heading }
}

// Index of the heading with this name (any level, not case sensitive), or -1.
function findHeading(note, name) {
  var want = name.replace(/^#+\s*/, '').trim().toLowerCase()
  var paras = note.paragraphs || []
  for (var i = 0; i < paras.length; i++) {
    if (paras[i].type === 'title' && String(paras[i].content || '').trim().toLowerCase() === want) return i
  }
  return -1
}

// Where the first copy should go. Returns { index } to insert at, or { append: true }.
function placement(note, cfg) {
  var paras = note.paragraphs || []
  if (cfg.position === 'top') return { index: 0 }
  if (cfg.position === 'bottom') return { append: true }
  var h = findHeading(note, cfg.heading)
  if (cfg.position === 'under heading') {
    if (h === -1) {
      note.appendParagraph(cfg.heading, 'title')
      return { append: true }
    }
    return { index: h + 1 }
  }
  // above heading: if it's missing, fall back to the bottom
  if (h === -1) return { append: true }
  var idx = h
  while (idx > 0 && !String(paras[idx - 1].content || '').trim() && paras[idx - 1].type === 'empty') idx--
  return { index: idx }
}

async function say(text) {
  try {
    await CommandBar.prompt('Sync to Today', text)
  } catch (e) {
    console.log('Sync to Today: ' + text)
  }
}

async function syncToToday() {
  try {
    if (!Editor || !Editor.note) {
      await say('Open a note and put the cursor on a task first.')
      return
    }
    var selected = Editor.selectedParagraphs || []
    var tasks = selected.filter(function (p) {
      return TASK_TYPES.indexOf(p.type) !== -1
    })
    if (tasks.length === 0) {
      await say('Put the cursor on an open task first.')
      return
    }

    var today = todayNote()
    if (!today) {
      await say("Couldn't find today's note.")
      return
    }
    if (Editor.note.filename === today.filename) {
      await say("You're already in today's note.")
      return
    }

    var where = placement(today, getSettings())
    var insertAt = where.index
    var added = 0
    var already = 0
    for (var i = 0; i < tasks.length; i++) {
      var id = ensureBlockId(Editor, tasks[i])
      var fresh = findByBlockId(Editor, id) || tasks[i]

      var alreadyThere = (today.paragraphs || []).some(function (p) {
        return getBlockId(p) === id
      })
      if (alreadyThere) {
        already++
        continue
      }

      var raw = (fresh.rawContent || '* ' + fresh.content).replace(/^\s+/, '')
      if (!/\s\^[A-Za-z0-9]{6}\s*$/.test(raw)) raw = raw + ' ^' + id
      if (!where.append) {
        today.insertParagraph(raw, insertAt, 'text')
        insertAt++
      } else {
        today.appendParagraph(raw, 'text')
      }
      added++
    }

    try {
      DataStore.updateCache(today)
      DataStore.updateCache(Editor.note)
    } catch (e3) {
      console.log('updateCache failed (harmless): ' + e3)
    }
    console.log('Sync to Today: added ' + added + ', already there ' + already)
    if (added === 0 && already > 0) await say('Already in today\'s note.')
  } catch (err) {
    console.log('Sync to Today error: ' + err)
    await say('Something went wrong: ' + err)
  }
}
