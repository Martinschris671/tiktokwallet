document.addEventListener("DOMContentLoaded", () => {
  // --- DATA & STATE MANAGEMENT ---
  const defaults = {
    avail: 9700000.0,
    upcom: 2000000.0,
    diamonds: "30,464",
    limitRem: "9.7M",
    limitTot: "10.0M",
    confirmName: "Transfer details",
    successTitle: "Transfer details",
    transferLabel: "LIVE rewards transfer to TikTok",
    autoRemove: true,
  };

  const defaultTransactions = [
    {
      title: "LIVE rewards",
      date: "9/21/2025 19:50:53",
      amount: "+USD1,000",
      type: "positive",
      val: 0.01,
    },
  ];

  let currentAvailBal = 0;
  let isProfileValid = false;
  let activeTargetUsername = "";

  // Elements: Scroll Control
  const bodyEl = document.body;
  const appContainer = document.getElementById("appContainer");
  const toggleScroll = (disable) => {
    if (disable) {
      bodyEl.classList.add("no-scroll");
      appContainer.classList.add("no-scroll");
    } else {
      bodyEl.classList.remove("no-scroll");
      appContainer.classList.remove("no-scroll");
    }
  };

  // Elements: Dashboard
  const valAvailMain = document.getElementById("valAvailMain");
  const valAvailTab = document.getElementById("valAvailTab");
  const valUpcomTab = document.getElementById("valUpcomTab");
  const valDiamonds = document.getElementById("valDiamonds");
  const valLimits = document.getElementById("valLimits");

  // Elements: Settings Overlay / Toolbox
  const settingsMenu = document.getElementById("settingsMenu");
  const editAvail = document.getElementById("editAvail");
  const editUpcom = document.getElementById("editUpcom");
  const editDiamonds = document.getElementById("editDiamonds");
  const editLimitRem = document.getElementById("editLimitRem");
  const editLimitTot = document.getElementById("editLimitTot");

  const editConfirmName = document.getElementById("editConfirmName");
  const editSuccessTitle = document.getElementById("editSuccessTitle");
  const editTransferLabel = document.getElementById("editTransferLabel");
  const autoRemoveToggle = document.getElementById("autoRemoveToggle");
  const logoutBtn = document.getElementById("logoutBtn");

  // Elements: Withdraw Overlay
  const withdrawMenu = document.getElementById("withdrawMenu");
  const withdrawAmountInput = document.getElementById("withdrawAmountInput");
  const withdrawReceiveDisplay = document.getElementById(
    "withdrawReceiveDisplay",
  );
  const withdrawFeeDisplay = document.getElementById("withdrawFeeDisplay");
  const withdrawScreenLimits = document.getElementById("withdrawScreenLimits");
  const triggerConfirmBtn = document.getElementById("triggerConfirmBtn");
  const btnWithdrawAll = document.getElementById("btnWithdrawAll");

  // Text Override Targets
  const confirmModalTitle = document.getElementById("confirmModalTitle");
  const withdrawMenuTitle = document.getElementById("withdrawMenuTitle");
  const successOverlayTitle = document.getElementById("successOverlayTitle");
  const successTransferLabel = document.getElementById("successTransferLabel");

  // Elements: Confirm Modal
  const confirmModal = document.getElementById("confirmModal");
  const closeConfirmBtn = document.getElementById("closeConfirmBtn");
  const executeWithdrawBtn = document.getElementById("executeWithdrawBtn");
  const confTarget = document.getElementById("confTarget");
  const confAmount = document.getElementById("confAmount");
  const confFee = document.getElementById("confFee");
  const confReceive = document.getElementById("confReceive");

  // Elements: Loader, Success & Toast
  const loaderOverlay = document.getElementById("loaderOverlay");
  const successOverlay = document.getElementById("successOverlay");
  const toastContainer = document.getElementById("toastContainer");
  const succAmt = document.getElementById("succAmt");
  const succMethod = document.getElementById("succMethod");
  const succFee = document.getElementById("succFee");
  const succReceive = document.getElementById("succReceive");
  const succTime = document.getElementById("succTime");
  const succTxId = document.getElementById("succTxId");

  const showToast = (message) => {
    toastContainer.innerText = message;
    toastContainer.classList.add("show");
    setTimeout(() => {
      toastContainer.classList.remove("show");
    }, 3500);
  };

  // Helper: Format number
  const formatNumber = (num) => {
    let parts = parseFloat(num).toFixed(2).split(".");
    parts[0] = parseInt(parts[0], 10).toLocaleString("en-US");
    return parts.join(".");
  };

  // Auto-resize Amount Font dynamically
  const adjustAmountFontSize = () => {
    let fontSize = 42;
    valAvailMain.style.fontSize = `${fontSize}px`;
    const containerWidth = valAvailMain.parentElement.clientWidth;
    while (valAvailMain.scrollWidth > containerWidth && fontSize > 30) {
      fontSize -= 1;
      valAvailMain.style.fontSize = `${fontSize}px`;
    }
  };

  // Helper: Dates
  const getFormattedDate = () => {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
  };
  const getAMPMDate = () => {
    const d = new Date();
    let hours = d.getHours();
    let minutes = d.getMinutes();
    let seconds = d.getSeconds();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}, ${hours.toString().padStart(2, "0")}:${minutes}:${seconds} ${ampm}`;
  };

  // Month Selector Logic
  const initMonthSelector = () => {
    const displaySpan = document.getElementById("currentMonthDisplay");
    const input = document.getElementById("monthInput");
    const now = new Date();
    const formatted = now.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    displaySpan.innerText = formatted;
    input.value = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;

    input.addEventListener("change", (e) => {
      if (!e.target.value) return;
      const [yy, mm] = e.target.value.split("-");
      const dateObj = new Date(yy, mm - 1);
      displaySpan.innerText = dateObj.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
    });
  };

  // Advanced Transactions Rendering
  const renderTransactions = () => {
    let txList = JSON.parse(localStorage.getItem("mockTransactions"));
    if (!txList || txList.length === 0) txList = defaultTransactions;

    const container = document.getElementById("transactionListContainer");
    const summary = document.getElementById("transactionsSummary");
    container.innerHTML = "";
    let totalOut = 0;

    txList.forEach((tx) => {
      if (tx.type === "negative") totalOut += tx.val;
      const div = document.createElement("div");
      div.className = "transaction-item";
      div.innerHTML = `
        <div class="transaction-details">
          <div class="transaction-title">${tx.title}</div>
          <div class="transaction-date">${tx.date}</div>
        </div>
        <div class="transaction-amount ${tx.type === "positive" ? "amount-positive" : "amount-negative"}">${tx.amount}</div>
      `;
      container.appendChild(div);
    });
    summary.innerHTML = `In: USD97,000,000.00 &nbsp;Out: USD${formatNumber(totalOut)}`;
  };

  // Load Main Data
  const loadSettings = () => {
    let avail = localStorage.getItem("mockAvail");
    if (avail === null) avail = defaults.avail;
    currentAvailBal = parseFloat(avail) || 0;

    let upcom = localStorage.getItem("mockUpcom") || defaults.upcom;
    let diamonds = localStorage.getItem("mockDiamonds") || defaults.diamonds;
    let limitRem = localStorage.getItem("mockLimitRem") || defaults.limitRem;
    let limitTot = localStorage.getItem("mockLimitTot") || defaults.limitTot;

    let confirmName =
      localStorage.getItem("mockConfirmName") || defaults.confirmName;
    let successTitle =
      localStorage.getItem("mockSuccessTitle") || defaults.successTitle;
    let transferLabel =
      localStorage.getItem("mockTransferLabel") || defaults.transferLabel;

    let autoRemoveStorage = localStorage.getItem("mockAutoRemove");
    let autoRemove =
      autoRemoveStorage !== null
        ? autoRemoveStorage === "true"
        : defaults.autoRemove;

    // Apply dashboard numbers
    valAvailMain.innerText = formatNumber(currentAvailBal);
    adjustAmountFontSize();
    valAvailTab.innerText = `USD${formatNumber(currentAvailBal)}`;
    valUpcomTab.innerText = `USD${formatNumber(parseFloat(upcom) || 0)}`;
    valDiamonds.innerText = diamonds;
    valLimits.innerText = `$${limitRem}/$${limitTot}`;
    withdrawScreenLimits.innerText = `$${limitRem} / $${limitTot}`;

    // Apply Toolbox Input values
    editAvail.value = currentAvailBal;
    editUpcom.value = upcom;
    editDiamonds.value = diamonds;
    editLimitRem.value = limitRem;
    editLimitTot.value = limitTot;

    editConfirmName.value = confirmName;
    editSuccessTitle.value = successTitle;
    editTransferLabel.value = transferLabel;
    autoRemoveToggle.checked = autoRemove;

    // Apply overridden UI text strings
    confirmModalTitle.innerText = confirmName;
    withdrawMenuTitle.innerText = confirmName;
    successOverlayTitle.innerText = successTitle;
    successTransferLabel.innerText = transferLabel;

    initMonthSelector();
    renderTransactions();
  };

  loadSettings();
  window.addEventListener("resize", adjustAmountFontSize);

  // --- TOOLBOX (SETTINGS OVERLAY) ---
  document
    .getElementById("openSettingsTrigger")
    .addEventListener("click", () => {
      toggleScroll(true);
      settingsMenu.classList.add("open");
    });
  document.getElementById("closeSettingsBtn").addEventListener("click", () => {
    toggleScroll(false);
    settingsMenu.classList.remove("open");
  });
  document.getElementById("saveSettingsBtn").addEventListener("click", () => {
    localStorage.setItem("mockAvail", editAvail.value.replace(/,/g, ""));
    localStorage.setItem("mockUpcom", editUpcom.value.replace(/,/g, ""));
    localStorage.setItem("mockDiamonds", editDiamonds.value);
    localStorage.setItem("mockLimitRem", editLimitRem.value);
    localStorage.setItem("mockLimitTot", editLimitTot.value);

    localStorage.setItem("mockConfirmName", editConfirmName.value);
    localStorage.setItem("mockSuccessTitle", editSuccessTitle.value);
    localStorage.setItem("mockTransferLabel", editTransferLabel.value);
    localStorage.setItem("mockAutoRemove", autoRemoveToggle.checked);

    loadSettings();
    toggleScroll(false);
    settingsMenu.classList.remove("open");
  });

  // Toolbox Logout
  logoutBtn.addEventListener("click", async () => {
    try {
      if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.clear();
    window.location.href = "index.html";
  });

  // --- WITHDRAW LOGIC ---
  let currentFee = 0;
  let currentReceive = 0;

  document.getElementById("openWithdrawBtn").addEventListener("click", () => {
    toggleScroll(true);
    withdrawAmountInput.value = "";
    updateWithdrawMath();
    withdrawMenu.classList.add("open");
  });
  document.getElementById("closeWithdrawBtn").addEventListener("click", () => {
    toggleScroll(false);
    withdrawMenu.classList.remove("open");
  });

  const updateWithdrawMath = () => {
    let val = parseFloat(withdrawAmountInput.value);
    if (isNaN(val) || val <= 0) {
      withdrawReceiveDisplay.innerText = "0.00";
      withdrawFeeDisplay.innerText = "0.00 USD";
      triggerConfirmBtn.classList.remove("active");
      return;
    }

    currentFee = val * 0.02; // ~2% simulated fee
    currentReceive = val - currentFee;

    withdrawReceiveDisplay.innerText = currentReceive.toFixed(2);
    withdrawFeeDisplay.innerText = `${currentFee.toFixed(2)} USD`;

    if (val > 0 && val <= currentAvailBal && isProfileValid) {
      triggerConfirmBtn.classList.add("active");
    } else {
      triggerConfirmBtn.classList.remove("active");
    }
  };

  withdrawAmountInput.addEventListener("input", updateWithdrawMath);
  btnWithdrawAll.addEventListener("click", () => {
    withdrawAmountInput.value = currentAvailBal.toFixed(2);
    updateWithdrawMath();
  });

  // --- CONFIRM MODAL LOGIC ---
  triggerConfirmBtn.addEventListener("click", () => {
    if (!triggerConfirmBtn.classList.contains("active")) return;
    let amount = parseFloat(withdrawAmountInput.value);
    confTarget.innerText = `TikTok (@${activeTargetUsername})`;
    confAmount.innerText = amount.toFixed(2);
    confFee.innerText = currentFee.toFixed(2);
    confReceive.innerText = currentReceive.toFixed(2);
    confirmModal.classList.add("show");
  });

  closeConfirmBtn.addEventListener("click", () => {
    confirmModal.classList.remove("show");
  });

  // Execute Transaction
  executeWithdrawBtn.addEventListener("click", () => {
    let amount = parseFloat(withdrawAmountInput.value);
    confirmModal.classList.remove("show");
    loaderOverlay.classList.add("show");

    setTimeout(() => {
      currentAvailBal -= amount;
      localStorage.setItem("mockAvail", currentAvailBal);

      let txList =
        JSON.parse(localStorage.getItem("mockTransactions")) ||
        defaultTransactions;
      txList.unshift({
        title: `Transfer to @${activeTargetUsername}`,
        date: getFormattedDate(),
        amount: `-USD${amount.toFixed(2)}`,
        type: "negative",
        val: amount,
      });

      if (txList.length > 10) txList = txList.slice(0, 10);
      localStorage.setItem("mockTransactions", JSON.stringify(txList));
      loadSettings();

      succAmt.innerText = amount.toFixed(2);
      succMethod.innerText = `TikTok(@${activeTargetUsername})`;
      succFee.innerText = `${currentFee.toFixed(2)} USD`;
      succReceive.innerText = `${currentReceive.toFixed(2)} USD`;
      succTime.innerText = getAMPMDate();
      succTxId.innerText = Math.floor(
        1000000000000 + Math.random() * 9000000000000,
      ).toString();

      loaderOverlay.classList.remove("show");
      withdrawMenu.classList.remove("open");
      successOverlay.classList.add("show");

      // Show Success Toast
      showToast(
        `Transfer successful: $${amount.toFixed(2)} to @${activeTargetUsername}`,
      );
    }, 2000);
  });

  const closeSuccessView = () => {
    successOverlay.classList.remove("show");
    toggleScroll(false);
    withdrawAmountInput.value = "";
    document.getElementById("lookup_input").value = "";
    hideProfilePreview();
  };

  document
    .getElementById("closeSuccessBtn")
    .addEventListener("click", closeSuccessView);
  document
    .getElementById("backFromSuccessBtn")
    .addEventListener("click", closeSuccessView);

  // --- TIKTOK LOOKUP INTEGRATION (WITH RANDOM FALLBACK) ---
  const containerDiv = document.getElementById("recharge_container_div");
  const inputElement = document.getElementById("lookup_input");
  const profilePreview = document.getElementById("lookup_profilePreview");
  const contentWrapper = document.getElementById("lookup_contentWrapper");
  const avatar = document.getElementById("lookup_avatar");
  const nicknameLine = document.querySelector(".lookup_nicknameLine");
  const nickname = document.getElementById("lookup_nickname");
  const handle = document.getElementById("lookup_handle");
  const followers = document.getElementById("lookup_followers");
  const spinnerContainer = document.getElementById("lookup_spinnerContainer");

  let debounceTimeout = null;
  let fetchController = null;

  function abbreviateNumber(value) {
    const num = Number(value);
    if (isNaN(num)) return value;
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return num.toString();
  }

  function updateContainerHeight(isActive) {
    containerDiv.style.height = isActive ? "200px" : "auto";
  }

  async function fetchTikTokProfile(username, signal) {
    if (!username) return null;
    const apiUrl = `https://tiktok-scraper-api-8824.onrender.com/scrape?username=${encodeURIComponent(username)}`;
    try {
      const response = await fetch(apiUrl, { signal });
      if (!response.ok) return null;
      const result = await response.json();
      if (
        !result.data ||
        !result.data.unique_id ||
        result.data.unique_id === "No unique_id found"
      )
        return null;
      return {
        uniqueId: result.data.unique_id,
        nickname: result.data.nickname,
        avatar: result.data.profile_pic,
        followers: result.data.followers,
        verified: result.data.verified,
      };
    } catch (error) {
      return null;
    }
  }

  function showSpinner() {
    isProfileValid = false;
    updateWithdrawMath();
    updateContainerHeight(true);
    profilePreview.classList.add("hidden");
    spinnerContainer.classList.remove("hidden");
  }

  function showProfile(data) {
    isProfileValid = true;
    activeTargetUsername = data.uniqueId;
    updateWithdrawMath();

    nickname.textContent = data.nickname;
    handle.textContent = `@${data.uniqueId}`;
    avatar.src = data.avatar;
    followers.textContent = `${abbreviateNumber(data.followers)} followers`;

    const oldBadge = nicknameLine.querySelector("svg");
    if (oldBadge) oldBadge.remove();
    if (data.verified) {
      const vBadge = `<svg width="14" height="14" viewBox="0 0 48 48" fill="none" style="margin-left:4px" xmlns="http://www.w3.org/2000/svg"><circle cx="24" cy="24" r="24" fill="#20D5EC"></circle><path fill-rule="evenodd" clip-rule="evenodd" d="M37.1213 15.8787C38.2929 17.0503 38.2929 18.9497 37.1213 20.1213L23.6213 33.6213C22.4497 34.7929 20.5503 34.7929 19.3787 33.6213L10.8787 25.1213C9.70711 23.9497 9.70711 22.0503 10.8787 20.8787C12.0503 19.7071 13.9497 19.7071 15.1213 20.8787L21.5 27.2574L32.8787 15.8787C34.0503 14.7071 35.9497 14.7071 37.1213 15.8787Z" fill="white"></path></svg>`;
      nicknameLine.insertAdjacentHTML("beforeend", vBadge);
    }
    spinnerContainer.classList.add("hidden");
    profilePreview.classList.remove("hidden");
    contentWrapper.style.display = "flex";
  }

  function hideProfilePreview() {
    isProfileValid = false;
    updateWithdrawMath();
    updateContainerHeight(false);
    profilePreview.classList.add("hidden");
    spinnerContainer.classList.add("hidden");
  }

  inputElement.addEventListener("input", () => {
    // Auto @ remove logic
    if (autoRemoveToggle.checked && inputElement.value.includes("@")) {
      inputElement.value = inputElement.value.replace(/@/g, "");
    }

    const username = inputElement.value.trim();
    clearTimeout(debounceTimeout);
    if (fetchController) fetchController.abort();

    if (!username) {
      hideProfilePreview();
      return;
    }

    showSpinner();
    fetchController = new AbortController();
    const signal = fetchController.signal;

    debounceTimeout = setTimeout(async () => {
      let profileData = await fetchTikTokProfile(username, signal);
      if (!signal.aborted) {
        if (!profileData) {
          // RANDOM FALLBACK IF NOT FOUND
          profileData = {
            uniqueId: username,
            nickname: "User" + Math.floor(Math.random() * 99999),
            avatar: "tiktokicon.png",
            followers: Math.floor(Math.random() * 500000) + 1000,
            verified: Math.random() > 0.6, // 40% chance of verified
          };
        }
        showProfile(profileData);
      }
    }, 450);
  });
});
