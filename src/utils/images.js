export function safeImageUrl(url, fallback = '') {
  if (!url || typeof url !== 'string') return fallback;
  const t = url.trim();
  if (!t) return fallback;
  if (/^https?:\/\/[^/]+\/upload\//.test(t)) {
    return t.replace(/^https?:\/\/[^/]+/, '');
  }
  if (t.startsWith('https://') || t.startsWith('http://') || t.startsWith('./') || t.startsWith('/')) {
    return t;
  }
  return fallback;
}

export function getProfileImageUrl(currentUser, author, isMine, defaultUrl) {
  const fallback = defaultUrl && String(defaultUrl).trim() ? defaultUrl : '';
  let out = '';
  if (isMine && currentUser?.profileImageUrl) {
    out = safeImageUrl(currentUser.profileImageUrl, fallback) || fallback;
  } else {
    const url = author?.profileImageUrl ?? null;
    out = safeImageUrl(url, fallback) || fallback;
  }
  return out && String(out).trim() ? out : defaultUrl || '';
}

export function getImageUploadData(res) {
  const step1 = res?.data ?? res;
  const data = step1?.data ?? step1;
  const inner = data?.data ?? data;
  const payload = inner ?? data;
  return {
    imageId: payload?.id ?? null,
    url: payload?.fileUrl ?? null,
    signupToken: payload?.signupToken ?? null,
  };
}

export function revokeObjectUrlSafely(url) {
  if (!url || typeof url !== 'string') return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* ignore */
  }
}
