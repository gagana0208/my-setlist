import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Google Fonts ─── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Serif+JP:wght@300;400;600&family=Noto+Sans+JP:wght@300;400;500&family=M+PLUS+Rounded+1c:wght@300;400;700&family=Sawarabi+Mincho&family=Shippori+Mincho:wght@400;600&display=swap');
  `}</style>
);

/* ─── Utilities ─── */
const uid = () => Math.random().toString(36).slice(2, 10);
const STORAGE_KEY = "setlist_maker_v2";

const loadData = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
};
const saveData = (d) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
};

const KEYS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B",
              "Cm","C#m","Dm","D#m","Em","Fm","F#m","Gm","G#m","Am","A#m","Bm"];

const FONTS = [
  "Noto Serif JP",
  "Noto Sans JP",
  "Shippori Mincho",
  "Sawarabi Mincho",
  "M PLUS Rounded 1c",
  "Bebas Neue",
];

const DEFAULT_COMMON_ITEMS = [
  { id: "common_mc", label: "MC", icon: "🎤" },
  { id: "common_break", label: "休憩", icon: "☕" },
  { id: "common_tuning", label: "チューニング", icon: "🎸" },
  { id: "common_se", label: "SE", icon: "🔊" },
  { id: "common_encore", label: "〜 ENCORE 〜", icon: "⭐" },
  { id: "common_change", label: "衣装チェンジ", icon: "👕" },
];

const initialData = () => ({ bands: [], commonItems: DEFAULT_COMMON_ITEMS });

/* ─── Modal Component ─── */
function Modal({ title, onClose, children, maxWidth = 520 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div className="modal-title">{title}</div>
          <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Band Create/Edit Modal ─── */
function BandModal({ band, onSave, onClose }) {
  const [name, setName] = useState(band?.name || "");
  const [members, setMembers] = useState(band?.members || [{ id: uid(), name: "", part: "" }]);
  const [color, setColor] = useState(band?.color || "#c9a84c");

  const COLORS = ["#c9a84c","#4a9eff","#ff6b6b","#4ade80","#c084fc","#fb923c","#f472b6","#34d399"];

  const addMember = () => setMembers(m => [...m, { id: uid(), name: "", part: "" }]);
  const updateMember = (id, k, v) => setMembers(m => m.map(x => x.id === id ? { ...x, [k]: v } : x));
  const removeMember = (id) => setMembers(m => m.filter(x => x.id !== id));

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), members: members.filter(m => m.name.trim()), color });
  };

  return (
    <Modal title={band ? "バンドタグを編集" : "バンドタグを作成"} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">バンド名 *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="バンド名を入力" autoFocus />
      </div>
      <div className="form-group">
        <label className="form-label">カラー</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 28, height: 28, borderRadius: "50%", background: c, border: "none",
              outline: color === c ? `3px solid ${c}` : "none",
              outlineOffset: 2, cursor: "pointer"
            }} />
          ))}
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: 28, height: 28, padding: 1, borderRadius: "50%", cursor: "pointer" }} />
        </div>
      </div>
      <div className="divider" />
      <div className="form-group">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <label className="form-label" style={{ margin: 0 }}>メンバー & パート</label>
          <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={addMember}>+ 追加</button>
        </div>
        {members.map((m) => (
          <div key={m.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8 }}>
            <input value={m.name} onChange={e => updateMember(m.id, "name", e.target.value)} placeholder="名前" />
            <input value={m.part} onChange={e => updateMember(m.id, "part", e.target.value)} placeholder="パート (Gt, Ba...)" />
            <button className="btn btn-ghost" style={{ padding: "4px 8px" }} onClick={() => removeMember(m.id)}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn" onClick={onClose}>キャンセル</button>
        <button className="btn btn-primary" onClick={handleSave}>保存</button>
      </div>
    </Modal>
  );
}

/* ─── Song Create/Edit Modal ─── */
function SongModal({ song, onSave, onClose }) {
  const [form, setForm] = useState({
    title: song?.title || "",
    bpm: song?.bpm || "",
    key: song?.key || "",
    capo: song?.capo || "",
    durationMin: song?.durationMin ?? "",
    durationSec: song?.durationSec ?? "",
    memo: song?.memo || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, title: form.title.trim() });
  };

  return (
    <Modal title={song ? "曲を編集" : "曲を追加"} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">曲名 *</label>
        <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="曲名を入力" autoFocus />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">BPM</label>
          <input type="number" value={form.bpm} onChange={e => set("bpm", e.target.value)} placeholder="120" min="1" max="999" />
        </div>
        <div className="form-group">
          <label className="form-label">キー</label>
          <select value={form.key} onChange={e => set("key", e.target.value)}>
            <option value="">-</option>
            {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">カポ</label>
          <select value={form.capo} onChange={e => set("capo", e.target.value)}>
            <option value="">なし</option>
            {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}フレット</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">曲の長さ</label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="number" value={form.durationMin} onChange={e => set("durationMin", e.target.value)}
            placeholder="0" min="0" max="59" style={{ width: 70, textAlign: "right" }} />
          <span style={{ color: "var(--text2)", fontSize: 13, flexShrink: 0 }}>分</span>
          <input type="number" value={form.durationSec} onChange={e => set("durationSec", Math.min(59, Math.max(0, +e.target.value || 0)).toString())}
            placeholder="00" min="0" max="59" style={{ width: 70, textAlign: "right" }} />
          <span style={{ color: "var(--text2)", fontSize: 13, flexShrink: 0 }}>秒</span>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">メモ</label>
        <textarea value={form.memo} onChange={e => set("memo", e.target.value)} rows={2} placeholder="自由メモ" style={{ resize: "vertical" }} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn" onClick={onClose}>キャンセル</button>
        <button className="btn btn-primary" onClick={handleSave}>保存</button>
      </div>
    </Modal>
  );
}

/* ─── Setlist Create Modal ─── */
function SetlistCreateModal({ onSave, onClose }) {
  const [title, setTitle] = useState("");
  return (
    <Modal title="セットリストを作成" onClose={onClose}>
      <div className="form-group">
        <label className="form-label">タイトル</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="例: 2024/12/25 ライブ" autoFocus
          onKeyDown={e => e.key === "Enter" && title.trim() && onSave(title.trim())} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button className="btn" onClick={onClose}>キャンセル</button>
        <button className="btn btn-primary" onClick={() => title.trim() && onSave(title.trim())}>作成</button>
      </div>
    </Modal>
  );
}

/* ─── Confirm Modal ─── */
function ConfirmModal({ message, onOk, onCancel }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: 400, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 14 }}>🗑️</div>
        <div style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 24, color: "var(--text)" }}>{message}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="btn" style={{ minWidth: 80 }} onClick={onCancel}>NG</button>
          <button className="btn btn-danger" style={{ minWidth: 80 }} onClick={onOk}>OK</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Common Items Edit Modal ─── */
function CommonItemsModal({ items, onSave, onClose }) {
  const ICONS = ["🎤","☕","🎸","🔊","⭐","👕","🎺","🥁","🎹","🎻","🎵","🎶","💡","🔥","❄️","🌟","🎭","🎬","📣","🔔"];
  const [localItems, setLocalItems] = useState(items.map(i => ({ ...i })));

  const add = () => setLocalItems(li => [...li, { id: uid(), label: "", icon: "🎵" }]);
  const remove = (id) => setLocalItems(li => li.filter(x => x.id !== id));
  const update = (id, k, v) => setLocalItems(li => li.map(x => x.id === id ? { ...x, [k]: v } : x));

  return (
    <Modal title="共通アイテムを編集" onClose={onClose} maxWidth={560}>
      <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 14 }}>
        MC・休憩などの共通アイテムを管理します。全バンドのセットリストで使用できます。
      </div>
      <div style={{ maxHeight: 380, overflowY: "auto", marginBottom: 16 }}>
        {localItems.map((item, idx) => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <select value={item.icon} onChange={e => update(item.id, "icon", e.target.value)}
              style={{ width: 64, fontSize: 18, textAlign: "center", padding: "4px 4px" }}>
              {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>
            <input value={item.label} onChange={e => update(item.id, "label", e.target.value)}
              placeholder="項目名" style={{ fontSize: 14 }} />
            <button className="btn btn-ghost btn-danger" style={{ padding: "4px 8px" }}
              onClick={() => remove(item.id)}>🗑️</button>
          </div>
        ))}
      </div>
      <button className="btn" style={{ width: "100%", justifyContent: "center", marginBottom: 16 }} onClick={add}>
        ＋ 項目を追加
      </button>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button className="btn" onClick={onClose}>キャンセル</button>
        <button className="btn btn-primary" onClick={() => onSave(localItems.filter(i => i.label.trim()))}>保存</button>
      </div>
    </Modal>
  );
}

/* ─── Home View ─── */
function HomeView({ data, setData, onOpenSetlist }) {
  const [showBandModal, setShowBandModal] = useState(false);
  const [editingBand, setEditingBand] = useState(null);
  const [addSongBandId, setAddSongBandId] = useState(null);
  const [editSong, setEditSong] = useState(null);
  const [createSetlistBandId, setCreateSetlistBandId] = useState(null);
  const [editingSetlist, setEditingSetlist] = useState(null);
  const [expandedBands, setExpandedBands] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showCommonItemsModal, setShowCommonItemsModal] = useState(false);

  const commonItems = data.commonItems || DEFAULT_COMMON_ITEMS;

  const update = (fn) => setData(prev => { const n = fn(JSON.parse(JSON.stringify(prev))); saveData(n); return n; });

  const saveBand = (bandData) => {
    if (editingBand) {
      update(d => { const b = d.bands.find(x => x.id === editingBand.id); Object.assign(b, bandData); return d; });
      setEditingBand(null);
    } else {
      const newBand = { id: uid(), songs: [], setlists: [], ...bandData };
      update(d => { d.bands.push(newBand); return d; });
      setExpandedBands(e => ({ ...e, [newBand.id]: true }));
    }
    setShowBandModal(false);
  };

  const deleteBand = (id) => {
    setConfirmDelete({
      message: "バンドを削除します。\n曲・セットリストもすべて削除されます。\n問題なければOKを押してください。",
      onOk: () => { update(d => { d.bands = d.bands.filter(b => b.id !== id); return d; }); setConfirmDelete(null); }
    });
  };

  const saveSong = (bandId, songData) => {
    if (editSong && editSong.song) {
      update(d => {
        const b = d.bands.find(x => x.id === bandId);
        const idx = b.songs.findIndex(s => s.id === editSong.song.id);
        b.songs[idx] = { ...b.songs[idx], ...songData };
        return d;
      });
      setEditSong(null);
    } else {
      update(d => {
        const b = d.bands.find(x => x.id === bandId);
        b.songs.push({ id: uid(), ...songData });
        return d;
      });
      setAddSongBandId(null);
    }
  };

  const deleteSong = (bandId, songTitle, songId) => {
    setConfirmDelete({
      message: `「${songTitle}」を削除します。\n問題なければOKを押してください。`,
      onOk: () => {
        update(d => {
          const b = d.bands.find(x => x.id === bandId);
          b.songs = b.songs.filter(s => s.id !== songId);
          return d;
        });
        setConfirmDelete(null);
      }
    });
  };

  const createSetlist = (bandId, title) => {
    const newId = uid();
    update(d => {
      const b = d.bands.find(x => x.id === bandId);
      b.setlists.push({
        id: newId, title, items: [],
        showTitle: true, showNumbers: true,
        showBpm: false, showKey: true, showCapo: false, showCommonIcon: true,
        // font settings for songs
        font: "Noto Serif JP", fontSize: 18, letterSpacing: 1, lineHeight: 1.8,
        // common-item font customization
        commonFontMirrorSong: true,     // 曲と同じ設定か
        commonFont: "Noto Serif JP", commonFontSize: 18, commonLetterSpacing: 1, commonLineHeight: 1.8,
        textAlign: "left", titleAlign: "left",
        // common item alignment (initially same as textAlign)
        commonTextAlign: null,
        fontColor: "#ffffff", bgColor: "#1a1a2e", bgImage: null,
        pages: 1,
      });
      return d;
    });
    setCreateSetlistBandId(null);
    onOpenSetlist(bandId, newId);
  };

  const saveSetlistTitle = (bandId, setlistId, title) => {
    update(d => {
      const b = d.bands.find(x => x.id === bandId);
      const s = b.setlists.find(x => x.id === setlistId);
      if (s) s.title = title;
      return d;
    });
    setEditingSetlist(null);
  };

  const deleteSetlist = (bandId, setlistId, setlistTitle) => {
    setConfirmDelete({
      message: `「${setlistTitle}」を削除します。\n問題なければOKを押してください。`,
      onOk: () => {
        update(d => {
          const b = d.bands.find(x => x.id === bandId);
          b.setlists = b.setlists.filter(s => s.id !== setlistId);
          return d;
        });
        setConfirmDelete(null);
      }
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 38, letterSpacing: 6, color: "var(--gold)",
          lineHeight: 1, marginBottom: 4
        }}>SETLIST MAKER</div>
        <div style={{ fontSize: 12, color: "var(--text2)", letterSpacing: 2 }}>
          セットリスト作成ツール
        </div>
      </div>

      {/* Add Band Button + Common Items */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <button className="btn btn-primary" style={{ fontSize: 14, padding: "10px 20px" }}
          onClick={() => setShowBandModal(true)}>
          ＋ バンドタグを作成
        </button>
        <button className="btn" style={{ fontSize: 14, padding: "10px 20px" }}
          onClick={() => setShowCommonItemsModal(true)}>
          ✏️ 共通アイテムを編集
        </button>
      </div>

      {/* Empty State */}
      {data.bands.length === 0 && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          border: "1px dashed var(--border)", borderRadius: 12,
          color: "var(--text2)"
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎸</div>
          <div style={{ fontSize: 14 }}>バンドタグを作成→曲を追加→セットリストを作成しよう！</div>
        </div>
      )}

      {/* Band List */}
      {data.bands.map(band => {
        const expanded = expandedBands[band.id] !== false;
        return (
          <div key={band.id} style={{
            background: "var(--bg2)", border: "1px solid var(--border)",
            borderRadius: 12, marginBottom: 16,
            borderTop: `3px solid ${band.color || "var(--gold)"}`,
          }}>
            {/* Band Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "16px 20px", cursor: "pointer"
            }} onClick={() => setExpandedBands(e => ({ ...e, [band.id]: !expanded }))}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: band.color || "var(--gold)"
                }} />
                <span style={{ fontWeight: 500, fontSize: 16 }}>
                  {band.name}
                </span>
                {band.members?.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {band.members.slice(0, 3).map(m => (
                      <span key={m.id} className="chip">{m.name}{m.part && ` / ${m.part}`}</span>
                    ))}
                    {band.members.length > 3 && <span className="chip">+{band.members.length - 3}</span>}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }}
                  onClick={e => { e.stopPropagation(); setEditingBand(band); setShowBandModal(true); }}>✏️</button>
                <button className="btn btn-ghost btn-danger" style={{ padding: "4px 8px", fontSize: 12 }}
                  onClick={e => { e.stopPropagation(); deleteBand(band.id); }}>🗑️</button>
                <span style={{ color: "var(--text2)", fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
              </div>
            </div>

            {expanded && (
              <div style={{ padding: "0 20px 20px" }}>
                {/* Action buttons */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                  <button className="btn" style={{ borderColor: band.color || "var(--gold)", color: band.color || "var(--gold)" }}
                    onClick={() => setCreateSetlistBandId(band.id)}>
                    ＋ セットリストを作成
                  </button>
                  <button className="btn" onClick={() => setAddSongBandId(band.id)}>
                    ＋ 曲を追加
                  </button>
                </div>

                {/* Setlists */}
                {band.setlists.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, letterSpacing: 1, color: "var(--text2)", textTransform: "uppercase", marginBottom: 8 }}>
                      セットリスト
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {band.setlists.map(sl => {
                        const songCount = sl.items
                          .filter(x => x.type === "song")
                          .filter(x => band.songs.find(s => s.id === x.id)).length;
                        return (
                        <div key={sl.id} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "10px 14px", background: "var(--bg3)",
                          borderRadius: 8, border: "1px solid var(--border)",
                          cursor: "pointer", transition: "border-color 0.2s",
                        }}
                          onClick={() => onOpenSetlist(band.id, sl.id)}
                          onMouseEnter={e => e.currentTarget.style.borderColor = band.color || "var(--gold)"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
                            <span style={{ fontSize: 15, flexShrink: 0 }}>📋</span>
                            {editingSetlist?.setlist.id === sl.id ? (
                              <input
                                autoFocus
                                value={editingSetlist.title}
                                onChange={e => setEditingSetlist(es => ({ ...es, title: e.target.value }))}
                                onClick={e => e.stopPropagation()}
                                onKeyDown={e => {
                                  if (e.key === "Enter") saveSetlistTitle(band.id, sl.id, editingSetlist.title);
                                  if (e.key === "Escape") setEditingSetlist(null);
                                }}
                                style={{ fontSize: 14, padding: "2px 8px", width: 200 }}
                              />
                            ) : (
                              <span style={{ fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sl.title}</span>
                            )}
                            <span className="chip" style={{ flexShrink: 0 }}>{songCount}曲</span>
                          </div>
                          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            {editingSetlist?.setlist.id === sl.id ? (
                              <>
                                <button className="btn btn-primary" style={{ padding: "2px 10px", fontSize: 11 }}
                                  onClick={e => { e.stopPropagation(); saveSetlistTitle(band.id, sl.id, editingSetlist.title); }}>保存</button>
                                <button className="btn btn-ghost" style={{ padding: "2px 7px", fontSize: 11 }}
                                  onClick={e => { e.stopPropagation(); setEditingSetlist(null); }}>✕</button>
                              </>
                            ) : (
                              <>
                                <button className="btn btn-ghost" style={{ padding: "2px 7px", fontSize: 11 }}
                                  onClick={e => { e.stopPropagation(); setEditingSetlist({ bandId: band.id, setlist: sl, title: sl.title }); }}>✏️</button>
                                <button className="btn btn-ghost btn-danger" style={{ padding: "2px 7px", fontSize: 11 }}
                                  onClick={e => { e.stopPropagation(); deleteSetlist(band.id, sl.id, sl.title); }}>🗑️</button>
                              </>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Songs */}
                {band.songs.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: 1, color: "var(--text2)", textTransform: "uppercase", marginBottom: 8 }}>
                      曲リスト ({band.songs.length}曲)
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {band.songs.map((song, idx) => (
                        <div key={song.id} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "8px 12px", background: "var(--bg3)",
                          borderRadius: 6, fontSize: 13,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "var(--text2)", minWidth: 20, fontSize: 11 }}>{idx + 1}</span>
                            <span>{song.title}</span>
                            {song.bpm && <span className="chip">♩{song.bpm}</span>}
                            {song.key && <span className="chip">{song.key}</span>}
                            {song.capo && <span className="chip">Capo {song.capo}</span>}
                            {((parseInt(song.durationMin)||0) + (parseInt(song.durationSec)||0) > 0) && (
                              <span className="chip">⏱ {parseInt(song.durationMin)||0}:{String(parseInt(song.durationSec)||0).padStart(2,"0")}</span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button className="btn btn-ghost" style={{ padding: "2px 7px", fontSize: 11 }}
                              onClick={() => setEditSong({ bandId: band.id, song })}>✏️</button>
                            <button className="btn btn-ghost btn-danger" style={{ padding: "2px 7px", fontSize: 11 }}
                              onClick={() => deleteSong(band.id, song.title, song.id)}>🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {band.songs.length === 0 && band.setlists.length === 0 && (
                  <div style={{ fontSize: 13, color: "var(--text2)", textAlign: "center", padding: "16px 0" }}>
                    「＋曲を追加」から曲を登録してください
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Modals */}
      {showBandModal && (
        <BandModal
          band={editingBand}
          onSave={saveBand}
          onClose={() => { setShowBandModal(false); setEditingBand(null); }}
        />
      )}
      {addSongBandId && (
        <SongModal
          onSave={(song) => saveSong(addSongBandId, song)}
          onClose={() => setAddSongBandId(null)}
        />
      )}
      {editSong && (
        <SongModal
          song={editSong.song}
          onSave={(song) => saveSong(editSong.bandId, song)}
          onClose={() => setEditSong(null)}
        />
      )}
      {createSetlistBandId && (
        <SetlistCreateModal
          onSave={(title) => createSetlist(createSetlistBandId, title)}
          onClose={() => setCreateSetlistBandId(null)}
        />
      )}
      {confirmDelete && (
        <ConfirmModal
          message={confirmDelete.message}
          onOk={confirmDelete.onOk}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {showCommonItemsModal && (
        <CommonItemsModal
          items={commonItems}
          onSave={(items) => { update(d => { d.commonItems = items; return d; }); setShowCommonItemsModal(false); }}
          onClose={() => setShowCommonItemsModal(false)}
        />
      )}

      {/* ─── Footer ─── */}
      <div style={{
        marginTop: 60, paddingTop: 24,
        borderTop: "1px solid var(--border)",
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: 16, letterSpacing: 3, color: "var(--gold)", marginBottom: 8
        }}>SETLIST MAKER</div>
        {/* ↓ ここにWebサイトや開発者情報を記載してください */}
        <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.8 }}>
          <div>© 2026 Naoki Yoshihara</div>
          <div>
            <a 
              href="https://X.com/gagana02"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text2)", textDecoration: "none" }}
              onMouseEnter={e => e.target.style.color = "var(--gold)"}
              onMouseLeave={e => e.target.style.color = "var(--text2)"}>
              SNS
            </a>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "var(--border)" }}>v1.0.0</div>
        </div>
      </div>

    </div>
  );
}

/* ─── Setlist Editor ─── */
function SetlistEditor({ data, setData, bandId, setlistId, onBack }) {
  const update = (fn) => setData(prev => {
    const n = JSON.parse(JSON.stringify(prev));
    fn(n);
    saveData(n);
    return n;
  });

  const band = data.bands.find(b => b.id === bandId);
  const setlist = band?.setlists.find(s => s.id === setlistId);
  const commonItems = data.commonItems || DEFAULT_COMMON_ITEMS;

  const [dragOver, setDragOver] = useState(null);
  const [draggingItem, setDraggingItem] = useState(null);
  const [draggingSource, setDraggingSource] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingDuration, setEditingDuration] = useState(null); // instanceId of common item being edited
  const previewRef = useRef(null);
  const itemRefs = useRef({});

  if (!band || !setlist) return <div>Not found</div>;

  const updateSetlist = (patch) => update(d => {
    const b = d.bands.find(x => x.id === bandId);
    const s = b.setlists.find(x => x.id === setlistId);
    Object.assign(s, patch);
  });

  const addItem = (item, targetIdx = null) => {
    const newItem = { ...item, instanceId: uid() };
    update(d => {
      const b = d.bands.find(x => x.id === bandId);
      const s = b.setlists.find(x => x.id === setlistId);
      if (targetIdx !== null) {
        s.items.splice(targetIdx, 0, newItem);
      } else {
        s.items.push(newItem);
      }
    });
  };

  const removeItem = (instanceId) => update(d => {
    const b = d.bands.find(x => x.id === bandId);
    const s = b.setlists.find(x => x.id === setlistId);
    s.items = s.items.filter(x => x.instanceId !== instanceId);
  });

  const updateItemDuration = (instanceId, durationMin, durationSec) => update(d => {
    const b = d.bands.find(x => x.id === bandId);
    const s = b.setlists.find(x => x.id === setlistId);
    const item = s.items.find(x => x.instanceId === instanceId);
    if (item) { item.durationMin = durationMin; item.durationSec = durationSec; }
  });

  const moveItem = (fromIdx, toIdx) => update(d => {
    const b = d.bands.find(x => x.id === bandId);
    const s = b.setlists.find(x => x.id === setlistId);
    const items = [...s.items];
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    s.items = items;
  });

  // Compute which drop slot (0..items.length) to highlight based on mouse Y
  const getDropIdx = (e, currentItems) => {
    const entries = Object.entries(itemRefs.current);
    if (entries.length === 0) return currentItems.length;
    let best = currentItems.length;
    for (let i = 0; i < currentItems.length; i++) {
      const el = itemRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (e.clientY < mid) { best = i; break; }
    }
    return best;
  };

  const handleDragStart = (e, item, source, idx) => {
    setDraggingItem({ ...item, _sourceIdx: idx });
    setDraggingSource(source);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOverZone = (e) => {
    e.preventDefault();
    const idx = getDropIdx(e, setlist.items);
    setDragOver(idx);
  };

  const handleDropZone = (e) => {
    e.preventDefault();
    if (!draggingItem) return;
    const idx = getDropIdx(e, setlist.items);
    if (draggingSource === "setlist") {
      const from = draggingItem._sourceIdx;
      // adjust for removal shift
      const to = idx > from ? idx - 1 : idx;
      if (from !== to) moveItem(from, to);
    } else {
      addItem(draggingItem, idx);
    }
    setDragOver(null);
    setDraggingItem(null);
  };

  /* ─── Export ─── */
  const exportPNG = async () => {
    const el = document.getElementById("setlist-preview-pages");
    if (!el) return;
    const { default: html2canvas } = await import("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.esm.js").catch(() => ({ default: null }));
    if (!html2canvas) { alert("html2canvasが利用できません"); return; }
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: null });
    const link = document.createElement("a");
    link.download = `${setlist.title || "setlist"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const exportPDF = async () => {
    setShowPreview(true);
    setTimeout(() => window.print(), 500);
  };

  const sl = setlist;
  const itemStyle = (sl) => ({
    fontFamily: `'${sl.font}', sans-serif`,
    fontSize: `${sl.fontSize}px`,
    letterSpacing: `${sl.letterSpacing}px`,
    lineHeight: sl.lineHeight || 1.8,
    color: sl.fontColor || "#ffffff",
    textAlign: sl.textAlign || "left",
  });

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Left Panel - Song Library */}
      <div style={{
        width: 260, flexShrink: 0,
        background: "var(--bg2)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", overflow: "hidden"
      }}>
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)" }}>
          <button className="btn btn-ghost" style={{ padding: "6px 10px", fontSize: 12, marginBottom: 10 }} onClick={onBack}>
            ← ホームへ
          </button>
          <div style={{
            fontFamily: "'Bebas Neue'", letterSpacing: 2, fontSize: 14, color: "var(--gold)", marginBottom: 16
          }}>SONG LIST by</div>
          <div style={{ fontSize: 12, color: "var(--gold)" }}>{band.name}</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {/* Band Songs */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: 1, color: "var(--text2)", textTransform: "uppercase", padding: "4px 6px", marginBottom: 4 }}>曲</div>
            {band.songs.map((song, idx) => (
              <div key={song.id} draggable
                onDragStart={e => handleDragStart(e, { ...song, type: "song" }, "songs", idx)}
                style={{
                  padding: "8px 10px", borderRadius: 6,
                  cursor: "grab", userSelect: "none",
                  marginBottom: 3,
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  fontSize: 13,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--gold)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span>🎵 {song.title}</span>
                  <button className="btn btn-ghost" style={{ padding: "0 4px", fontSize: 11, border: "none" }}
                    onClick={() => addItem({ ...song, type: "song" })}>+</button>
                </div>
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  {song.bpm && <span className="chip">♩{song.bpm}</span>}
                  {song.key && <span className="chip">{song.key}</span>}
                  {song.capo && <span className="chip">Capo{song.capo}</span>}
                </div>
              </div>
            ))}
            {band.songs.length === 0 && <div style={{ fontSize: 12, color: "var(--text2)", padding: "8px 6px" }}>曲がありません</div>}
          </div>

          {/* Common Items */}
          <div>
            <div style={{ fontSize: 10, letterSpacing: 1, color: "var(--text2)", textTransform: "uppercase", padding: "4px 6px", marginBottom: 4 }}>共通アイテム</div>
            {commonItems.map((item) => (
              <div key={item.id} draggable
                onDragStart={e => handleDragStart(e, { ...item, type: item.type || "common" }, "songs", -1)}
                style={{
                  padding: "8px 10px", borderRadius: 6,
                  cursor: "grab", userSelect: "none",
                  marginBottom: 3,
                  background: "var(--bg3)", border: "1px solid var(--border)",
                  fontSize: 13,
                  transition: "border-color 0.15s",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <span>{item.icon} {item.label}</span>
                <button className="btn btn-ghost" style={{ padding: "0 4px", fontSize: 11, border: "none" }}
                  onClick={() => addItem({ ...item, type: item.type || "common" })}>+</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{
          padding: "12px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          background: "var(--bg2)"
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            {sl.showTitle ? (
              <input value={sl.title} onChange={e => updateSetlist({ title: e.target.value })}
                style={{ background: "transparent", border: "none", fontSize: 18, fontWeight: 600, color: "var(--text)", padding: 0 }} />
            ) : (
              <span style={{ fontSize: 14, color: "var(--text2)" }}>タイトル非表示</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={() => setShowSettings(s => !s)}>⚙ 設定</button>
            <button className="btn" onClick={() => setShowPreview(s => !s)}>👁 プレビュー</button>
            <button className="btn btn-primary" onClick={exportPDF}>📄 PDF/印刷</button>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Setlist Drop Zone */}
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            <div
              style={{
                background: sl.bgColor || "#1a1a2e",
                backgroundImage: sl.bgImage ? `url(${sl.bgImage})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: 400,
                borderRadius: 10,
                padding: "24px",
                position: "relative",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
                // Apply font & color to entire container so all children inherit
                fontFamily: `'${sl.font}', sans-serif`,
                fontSize: `${sl.fontSize}px`,
                letterSpacing: `${sl.letterSpacing}px`,
                lineHeight: sl.lineHeight || 1.8,
                color: sl.fontColor || "#ffffff",
              }}
              onDragOver={handleDragOverZone}
              onDrop={handleDropZone}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null);
              }}
            >
              {sl.showTitle && (
                <div style={{
                  ...itemStyle(sl),
                  fontSize: `${sl.fontSize + 6}px`,
                  fontWeight: 600,
                  marginBottom: 20,
                  textAlign: sl.titleAlign || sl.textAlign || "left",
                }}>
                  {sl.title}
                </div>
              )}

              {sl.items.length === 0 && (
                <div style={{
                  textAlign: "center", padding: "40px",
                  border: "2px dashed rgba(255,255,255,0.15)", borderRadius: 8,
                  color: "rgba(255,255,255,0.3)", fontSize: 13
                }}>
                  ← 曲をここにドラッグ＆ドロップ
                </div>
              )}

              {/* Drop indicator at top */}
              {dragOver === 0 && (
                <div style={{
                  height: 3, background: "var(--gold)", borderRadius: 2,
                  marginBottom: 4, boxShadow: "0 0 6px var(--gold)"
                }} />
              )}

              {sl.items.map((item, idx) => {
                // ── Resolve latest data ──────────────────────────────────
                // For songs: merge stored item with current band.songs entry
                // (title/bpm/key/capo/memo may have changed; if song deleted, skip)
                let resolvedItem = item;
                if (item.type === "song") {
                  const latestSong = band.songs.find(s => s.id === item.id);
                  if (!latestSong) return null; // song was deleted → remove from view
                  resolvedItem = { ...item, ...latestSong, instanceId: item.instanceId };
                } else if (item.type === "common") {
                  // Refresh label/icon from current commonItems list
                  const latestCommon = commonItems.find(c => c.id === item.id);
                  if (latestCommon) {
                    resolvedItem = { ...item, label: latestCommon.label, icon: latestCommon.icon };
                  }
                }

                const songNum = resolvedItem.type === "song"
                  ? sl.items.slice(0, idx + 1).filter(x => x.type === "song").length
                  : null;

                const align = (resolvedItem.type === "common")
                  ? (sl.commonTextAlign || sl.textAlign || "left")
                  : (sl.textAlign || "left");
                const styleOverride = {};
                if (resolvedItem.type === "common" && sl.commonFontMirrorSong === false) {
                  styleOverride.fontFamily = sl.commonFont;
                  styleOverride.fontSize = sl.commonFontSize + "px";
                  styleOverride.letterSpacing = sl.commonLetterSpacing + "px";
                  styleOverride.lineHeight = sl.commonLineHeight || 1.8;
                }

                return (
                <div key={item.instanceId}>
                  <div
                    ref={el => itemRefs.current[idx] = el}
                    draggable
                    onDragStart={e => handleDragStart(e, item, "setlist", idx)}
                    style={{
                      display: "flex", alignItems: "center",
                      gap: 0, padding: "2px 4px",
                      cursor: "grab",
                      borderRadius: 4,
                      transition: "background 0.1s",
                      userSelect: "none",
                      opacity: draggingItem?._sourceIdx === idx && draggingSource === "setlist" ? 0.35 : 1,
                      ...styleOverride,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Drag handle */}
                    <span style={{
                      color: "rgba(255,255,255,0.2)", fontSize: 13, minWidth: 18,
                      cursor: "grab", flexShrink: 0
                    }}>⠿</span>

                    {/* Number + title: aligned together per textAlign setting */}
                    <span style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: align === "right" ? "flex-end"
                                    : align === "center" ? "center"
                                    : "flex-start",
                      gap: "0.3em",
                      overflow: "hidden",
                    }}>
                      {sl.showNumbers && resolvedItem.type === "song" && (
                        <span style={{ opacity: 0.6, flexShrink: 0 }}>{songNum}.</span>
                      )}
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: align }}>
                        {resolvedItem.type === "pagebreak"
                          ? <span style={{ display: "block", textAlign: "center", opacity: 0.5, fontSize: 11, letterSpacing: 2, color: "var(--gold)", borderTop: "1px dashed rgba(201,168,76,0.4)", borderBottom: "1px dashed rgba(201,168,76,0.4)", padding: "3px 0" }}>── PAGE BREAK ──</span>
                          : resolvedItem.type === "common"
                            ? <em style={{ fontStyle: "normal", opacity: 0.7 }}>{(sl.showCommonIcon !== false) ? resolvedItem.icon + " " : ""}{resolvedItem.label}</em>
                            : resolvedItem.title}
                      </span>
                    </span>

                    {/* BPM / Key / Capo: always right-aligned, fixed */}
                    <div style={{ display: "flex", gap: 4, opacity: 0.6, flexShrink: 0, fontSize: `${Math.max(10, sl.fontSize - 4)}px`, marginLeft: 6 }}>
                      {resolvedItem.type === "song" && sl.showBpm && String(resolvedItem.bpm).trim() !== "" && (
                        <span>♩{resolvedItem.bpm}</span>
                      )}
                      {resolvedItem.type === "song" && sl.showKey && String(resolvedItem.key).trim() !== "" && (
                        <span>{resolvedItem.key}</span>
                      )}
                      {resolvedItem.type === "song" && sl.showCapo && String(resolvedItem.capo).trim() !== "" && (
                        <span>Capo{resolvedItem.capo}</span>
                      )}
                    </div>

                    {/* Duration for common items: show time or edit inline */}
                    {resolvedItem.type === "common" && (
                      editingDuration === item.instanceId ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 6, flexShrink: 0 }}
                          onClick={e => e.stopPropagation()}>
                          <input type="number" defaultValue={item.durationMin || ""}
                            id={`dur-min-${item.instanceId}`}
                            min="0" max="59"
                            style={{ width: 40, padding: "1px 4px", fontSize: 11, textAlign: "right" }}
                            placeholder="0" />
                          <span style={{ fontSize: 11, color: "var(--text2)" }}>分</span>
                          <input type="number" defaultValue={item.durationSec || ""}
                            id={`dur-sec-${item.instanceId}`}
                            min="0" max="59"
                            style={{ width: 40, padding: "1px 4px", fontSize: 11, textAlign: "right" }}
                            placeholder="00" />
                          <span style={{ fontSize: 11, color: "var(--text2)" }}>秒</span>
                          <button style={{ background: "none", border: "1px solid var(--gold)", color: "var(--gold)", borderRadius: 4, fontSize: 10, padding: "1px 6px", cursor: "pointer" }}
                            onClick={() => {
                              const m = document.getElementById(`dur-min-${item.instanceId}`)?.value || "";
                              const s = document.getElementById(`dur-sec-${item.instanceId}`)?.value || "";
                              updateItemDuration(item.instanceId, m, s);
                              setEditingDuration(null);
                            }}>✓</button>
                          <button style={{ background: "none", border: "none", color: "var(--text2)", fontSize: 11, padding: "0 2px", cursor: "pointer" }}
                            onClick={() => setEditingDuration(null)}>✕</button>
                        </div>
                      ) : (
                        <button
                          style={{ background: "none", border: "none", cursor: "pointer", marginLeft: 6, flexShrink: 0, opacity: 0.5, fontSize: 11, color: "var(--text)", padding: "0 2px" }}
                          title="時間を設定"
                          onClick={e => { e.stopPropagation(); setEditingDuration(item.instanceId); }}>
                          {((parseInt(item.durationMin)||0) + (parseInt(item.durationSec)||0) > 0)
                            ? <span style={{ color: "var(--gold)", opacity: 1 }}>⏱ {parseInt(item.durationMin)||0}:{String(parseInt(item.durationSec)||0).padStart(2,"0")}</span>
                            : "⏱"}
                        </button>
                      )
                    )}
                    <button onClick={() => removeItem(item.instanceId)}
                      style={{ background: "none", border: "none", color: "rgba(255,100,100,0.4)", cursor: "pointer", fontSize: 14, padding: "0 4px", marginLeft: 4, flexShrink: 0 }}>
                      ✕
                    </button>
                  </div>

                  {/* Drop indicator AFTER this item */}
                  {dragOver === idx + 1 && (
                    <div style={{
                      height: 3, background: "var(--gold)", borderRadius: 2,
                      margin: "2px 0", boxShadow: "0 0 6px var(--gold)"
                    }} />
                  )}
                </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", marginTop: 12, color: "var(--text2)", fontSize: 12 }}>
              {(() => {
                const songCount = sl.items.filter(x => x.type === "song")
                  .filter(x => band.songs.find(s => s.id === x.id)).length;

                // Sum duration from songs (latest data) + common items (stored per-instance)
                const totalSec = sl.items.reduce((acc, item) => {
                  if (item.type === "song") {
                    const s = band.songs.find(s => s.id === item.id);
                    if (!s) return acc;
                    return acc + (parseInt(s.durationMin)||0)*60 + (parseInt(s.durationSec)||0);
                  } else if (item.type === "common") {
                    return acc + (parseInt(item.durationMin)||0)*60 + (parseInt(item.durationSec)||0);
                  }
                  return acc;
                }, 0);

                const hasDuration = totalSec > 0;
                const mm = Math.floor(totalSec / 60);
                const ss = String(totalSec % 60).padStart(2, "0");
                return (
                  <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
                    <span>合計: {songCount}曲</span>
                    {hasDuration && (
                      <span style={{ color: "var(--gold)" }}>⏱ {mm}:{ss}</span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div style={{
              width: 280, flexShrink: 0,
              background: "var(--bg2)", borderLeft: "1px solid var(--border)",
              overflowY: "auto", padding: "16px"
            }}>
              <div style={{ fontFamily: "'Bebas Neue'", letterSpacing: 2, fontSize: 14, color: "var(--gold)", marginBottom: 16 }}>
                SETTINGS
              </div>

              {/* Display */}
              <div style={{ marginBottom: 16 }}>
                <div className="form-label">表示設定</div>
                {[
                  ["showTitle", "タイトル表示"],
                  ["showNumbers", "曲番号"],
                  ["showBpm", "BPM"],
                  ["showKey", "キー"],
                  ["showCapo", "カポ"],
                  ["showCommonIcon", "共通項目の絵文字"],
                ].map(([k, label]) => (
                  <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13 }}>
                    <input type="checkbox" checked={sl[k]} onChange={e => updateSetlist({ [k]: e.target.checked })}
                      style={{ width: "auto", accentColor: "var(--gold)" }} />
                    {label}
                  </label>
                ))}
              </div>
              <div className="divider" />

              {/* Font */}
              <div style={{ marginBottom: 16 }}>
                <div className="form-label">フォント</div>
                <select value={sl.font} onChange={e => updateSetlist({ font: e.target.value })} style={{ marginBottom: 10 }}>
                  {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>

                <div className="form-label">文字サイズ: {sl.fontSize}px</div>
                <input type="range" min="10" max="32" value={sl.fontSize}
                  onChange={e => updateSetlist({ fontSize: +e.target.value })}
                  style={{ padding: 0, border: "none", background: "transparent", accentColor: "var(--gold)" }} />

                <div className="form-label" style={{ marginTop: 10 }}>文字間隔 (横): {sl.letterSpacing}px</div>
                <input type="range" min="0" max="10" value={sl.letterSpacing}
                  onChange={e => updateSetlist({ letterSpacing: +e.target.value })}
                  style={{ padding: 0, border: "none", background: "transparent", accentColor: "var(--gold)" }} />

                <div className="form-label" style={{ marginTop: 10 }}>行間 (縦): {(sl.lineHeight || 1.8).toFixed(1)}</div>
                <input type="range" min="1" max="4" step="0.1" value={sl.lineHeight || 1.8}
                  onChange={e => updateSetlist({ lineHeight: +e.target.value })}
                  style={{ padding: 0, border: "none", background: "transparent", accentColor: "var(--gold)" }} />
              </div>

              {/* Common item font */}
              <div style={{ marginBottom: 16 }}>
                <div className="form-label">共通項目設定</div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={sl.commonFontMirrorSong ?? true}
                    onChange={e => updateSetlist({ commonFontMirrorSong: e.target.checked })}
                    style={{ width: "auto", accentColor: "var(--gold)" }} />
                  曲と同じ設定
                </label>
                {!sl.commonFontMirrorSong && (
                  <>
                    <div className="form-label">フォント</div>
                    <select value={sl.commonFont || sl.font} onChange={e => updateSetlist({ commonFont: e.target.value })} style={{ marginBottom: 10 }}>
                      {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>

                    <div className="form-label">文字サイズ: { (sl.commonFontSize || sl.fontSize) }px</div>
                    <input type="range" min="10" max="32" value={sl.commonFontSize || sl.fontSize}
                      onChange={e => updateSetlist({ commonFontSize: +e.target.value })}
                      style={{ padding: 0, border: "none", background: "transparent", accentColor: "var(--gold)" }} />

                    <div className="form-label" style={{ marginTop: 10 }}>文字間隔 (横): {sl.commonLetterSpacing ?? sl.letterSpacing}px</div>
                    <input type="range" min="0" max="10" value={sl.commonLetterSpacing ?? sl.letterSpacing}
                      onChange={e => updateSetlist({ commonLetterSpacing: +e.target.value })}
                      style={{ padding: 0, border: "none", background: "transparent", accentColor: "var(--gold)" }} />

                    <div className="form-label" style={{ marginTop: 10 }}>行間 (縦): {((sl.commonLineHeight ?? sl.lineHeight) || 1.8).toFixed(1)}</div>
                    <input type="range" min="1" max="4" step="0.1" value={(sl.commonLineHeight ?? sl.lineHeight) || 1.8}
                      onChange={e => updateSetlist({ commonLineHeight: +e.target.value })}
                      style={{ padding: 0, border: "none", background: "transparent", accentColor: "var(--gold)" }} />
                  </>
                )}
              </div>
              <div className="divider" />
              <div className="divider" />

              {/* Text Alignment */}
              <div style={{ marginBottom: 16 }}>
                <div className="form-label">タイトルの文字配置</div>
                <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                  {[["left","左寄せ"],["center","中央"],["right","右寄せ"]].map(([val, label]) => (
                    <button key={val} className="btn"
                      style={{
                        flex: 1, justifyContent: "center", padding: "6px 4px", fontSize: 12,
                        borderColor: (sl.titleAlign || sl.textAlign || "left") === val ? "var(--gold)" : "var(--border)",
                        color: (sl.titleAlign || sl.textAlign || "left") === val ? "var(--gold)" : "var(--text2)",
                        background: (sl.titleAlign || sl.textAlign || "left") === val ? "rgba(201,168,76,0.1)" : "transparent",
                      }}
                      onClick={() => updateSetlist({ titleAlign: val })}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="form-label">曲一覧の文字配置</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[["left","左寄せ"],["center","中央"],["right","右寄せ"]].map(([val, label]) => (
                    <button key={val} className="btn"
                      style={{
                        flex: 1, justifyContent: "center", padding: "6px 4px", fontSize: 12,
                        borderColor: (sl.textAlign || "left") === val ? "var(--gold)" : "var(--border)",
                        color: (sl.textAlign || "left") === val ? "var(--gold)" : "var(--text2)",
                        background: (sl.textAlign || "left") === val ? "rgba(201,168,76,0.1)" : "transparent",
                      }}
                      onClick={() => updateSetlist({ textAlign: val })}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="form-label">共通項目の文字配置</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[ ["left","左寄せ"],["center","中央"],["right","右寄せ"] ].map(([val, label]) => (
                    <button key={val} className="btn"
                      style={{
                        flex: 1, justifyContent: "center", padding: "6px 4px", fontSize: 12,
                        borderColor: (sl.commonTextAlign || sl.textAlign || "left") === val ? "var(--gold)" : "var(--border)",
                        color: (sl.commonTextAlign || sl.textAlign || "left") === val ? "var(--gold)" : "var(--text2)",
                        background: (sl.commonTextAlign || sl.textAlign || "left") === val ? "rgba(201,168,76,0.1)" : "transparent",
                      }}
                      onClick={() => updateSetlist({ commonTextAlign: val })}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="divider" />

              {/* Colors */}
              <div style={{ marginBottom: 16 }}>
                <div className="form-label">文字色</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="color" value={sl.fontColor || "#ffffff"}
                    onChange={e => updateSetlist({ fontColor: e.target.value })}
                    style={{ width: 40, height: 32, padding: 2, cursor: "pointer" }} />
                  <input value={sl.fontColor || "#ffffff"}
                    onChange={e => updateSetlist({ fontColor: e.target.value })}
                    style={{ flex: 1, fontSize: 12 }} placeholder="#ffffff" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="form-label">背景色</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="color" value={sl.bgColor || "#1a1a2e"}
                    onChange={e => updateSetlist({ bgColor: e.target.value })}
                    style={{ width: 40, height: 32, padding: 2, cursor: "pointer" }} />
                  <input value={sl.bgColor || "#1a1a2e"}
                    onChange={e => updateSetlist({ bgColor: e.target.value })}
                    style={{ flex: 1, fontSize: 12 }} placeholder="#1a1a2e" />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div className="form-label">背景画像</div>
                <input type="file" accept="image/*" style={{ fontSize: 12, marginBottom: 8 }}
                  onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => updateSetlist({ bgImage: ev.target.result });
                    reader.readAsDataURL(file);
                  }} />
                {sl.bgImage && (
                  <div>
                    <div style={{
                      width: "100%", height: 60, borderRadius: 6,
                      backgroundImage: `url(${sl.bgImage})`,
                      backgroundSize: "cover", backgroundPosition: "center",
                      marginBottom: 6, border: "1px solid var(--border)"
                    }} />
                    <button className="btn btn-danger" style={{ width: "100%", justifyContent: "center" }}
                      onClick={() => updateSetlist({ bgImage: null })}>背景画像を削除</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal / Print */}
      {showPreview && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPreview(false)}>
          <div style={{ background: "var(--bg2)", borderRadius: 12, padding: 24, width: "90vw", maxWidth: 760, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div className="modal-title">プレビュー（A4）</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={() => window.print()}>🖨️ 印刷 / PDF保存</button>
                <button className="btn" onClick={() => setShowPreview(false)}>✕</button>
              </div>
            </div>
            {/* Split items into pages by page-break markers */}
            {(() => {
              // Build resolved items (latest song/common data, skip deleted songs)
              const resolvedItems = sl.items.map(item => {
                if (item.type === "song") {
                  const latest = band.songs.find(s => s.id === item.id);
                  if (!latest) return null;
                  return { ...item, ...latest, instanceId: item.instanceId };
                } else if (item.type === "common") {
                  const latest = commonItems.find(c => c.id === item.id);
                  return latest ? { ...item, label: latest.label, icon: latest.icon } : item;
                }
                return item;
              }).filter(Boolean);

              const pages = [[]];
              resolvedItems.forEach(item => {
                if (item.type === "pagebreak") { pages.push([]); }
                else { pages[pages.length - 1].push(item); }
              });
              let songCounter = 0;
              const align = (item) => {
                if (item && item.type === "common") {
                  return sl.commonTextAlign || sl.textAlign || "left";
                }
                return sl.textAlign || "left";
              };
              return (
                <div id="setlist-preview-pages">
                  {pages.map((pageItems, pageIdx) => (
                    <div key={pageIdx} style={{
                      width: "210mm",
                      minHeight: "297mm",
                      background: sl.bgColor || "#1a1a2e",
                      backgroundImage: sl.bgImage ? `url(${sl.bgImage})` : "none",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      padding: "20mm",
                      margin: "0 auto 16px",
                      boxSizing: "border-box",
                      pageBreakAfter: pageIdx < pages.length - 1 ? "always" : "auto",
                      fontFamily: `'${sl.font}', sans-serif`,
                      fontSize: `${sl.fontSize}px`,
                      letterSpacing: `${sl.letterSpacing}px`,
                      lineHeight: sl.lineHeight || 1.8,
                      color: sl.fontColor || "#ffffff",
                    }}>
                      {pageIdx === 0 && sl.showTitle && (
                        <div style={{
                          fontSize: `${sl.fontSize + 8}px`,
                          fontWeight: 600,
                          marginBottom: "10mm",
                          textAlign: sl.titleAlign || align,
                        }}>
                          {sl.title}
                        </div>
                      )}
                      {pageItems.map((item) => {
                        if (item.type === "song") songCounter++;
                        const num = item.type === "song" ? songCounter : null;
                        const styleOverride = {};
                        const align = (item.type === "common")
                          ? (sl.commonTextAlign || sl.textAlign || "left")
                          : (sl.textAlign || "left");
                        if (item.type === "common" && sl.commonFontMirrorSong === false) {
                          styleOverride.fontFamily = sl.commonFont;
                          styleOverride.fontSize = sl.commonFontSize + "px";
                          styleOverride.letterSpacing = sl.commonLetterSpacing + "px";
                          styleOverride.lineHeight = sl.commonLineHeight || 1.8;
                        }
                        return (
                          <div key={item.instanceId} style={{
                            display: "flex", alignItems: "baseline",
                            justifyContent: align(item) === "right" ? "flex-end"
                                          : align(item) === "center" ? "center"
                                          : "flex-start",
                            gap: "0.3em",
                            ...styleOverride,
                          }}>
                            {sl.showNumbers && item.type === "song" && (
                              <span style={{ opacity: 0.6, flexShrink: 0 }}>{num}.</span>
                            )}
                            <span style={{ textAlign: align(item) }}>
                              {item.type === "common"
                                ? ((sl.showCommonIcon !== false) ? `${item.icon || ""} ` : "") + item.label
                                : item.title}
                            </span>
                            <span style={{ display: "flex", gap: "0.5em", flexShrink: 0, fontSize: `${Math.max(10, sl.fontSize - 4)}px`, opacity: 0.7, marginLeft: "0.4em" }}>
                              {item.type === "song" && sl.showBpm && String(item.bpm).trim() !== "" && (
                                <span>♩{item.bpm}</span>
                              )}
                              {item.type === "song" && sl.showKey && String(item.key).trim() !== "" && (
                                <span>{item.key}</span>
                              )}
                              {item.type === "song" && sl.showCapo && String(item.capo).trim() !== "" && (
                                <span>Capo{item.capo}</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()}
            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                #setlist-preview-pages, #setlist-preview-pages * { visibility: visible !important; }
                #setlist-preview-pages { position: fixed; inset: 0; overflow: visible; }
                @page { size: A4; margin: 0; }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Root App ─── */
export default function App() {
  const [data, setData] = useState(() => loadData() || initialData());
  const [view, setView] = useState("home");
  const [activeBandId, setActiveBandId] = useState(null);
  const [activeSetlistId, setActiveSetlistId] = useState(null);

  const openSetlist = (bandId, setlistId) => {
    setActiveBandId(bandId);
    setActiveSetlistId(setlistId);
    setView("editor");
  };

  return (
    <>
      <FontLoader />
      {view === "home" && (
        <HomeView
          data={data}
          setData={setData}
          onOpenSetlist={openSetlist}
        />
      )}
      {view === "editor" && (
        <SetlistEditor
          data={data}
          setData={setData}
          bandId={activeBandId}
          setlistId={activeSetlistId}
          onBack={() => setView("home")}
        />
      )}
    </>
  );
}
 