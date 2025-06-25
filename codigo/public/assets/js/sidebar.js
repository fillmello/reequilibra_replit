// Sidebar functionality
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar")
  const sidebarToggle = document.getElementById("sidebarToggle")
  const expandSidebarBtn = document.getElementById("expandSidebarBtn")
  const mainWrapper = document.getElementById("mainWrapper")
  const navLinks = document.querySelectorAll(".nav-link, .sidebar-link")
  const sections = document.querySelectorAll(".section")

  // Check if required elements exist
  if (!sidebar) {
    console.warn("Sidebar element not found")
    return
  }

  function updateSidebarLogo() {
    const sidebarLogo = document.getElementById("sidebarLogo")
    const sidebar = document.getElementById("sidebar")
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light"

    if (sidebar.classList.contains("collapsed")) {
      // Use theme-appropriate small logo when collapsed
      if (currentTheme === "dark") {
        sidebarLogo.src = "../../assets/images/logo-small-white.png"
      } else {
        sidebarLogo.src = "../../assets/images/logo-small.png"
      }
    } else {
      // Use theme-appropriate full logo when expanded
      if (currentTheme === "dark") {
        sidebarLogo.src = "../../assets/images/logo-white.png"
      } else {
        sidebarLogo.src = "../../assets/images/logo.png"
      }
    }
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      const isMobile = window.innerWidth <= 768

      if (isMobile) {
        sidebar.classList.toggle("mobile-open")
        toggleOverlay()
      } else {
        sidebar.classList.toggle("collapsed")
        if (mainWrapper) {
          mainWrapper.classList.toggle("sidebar-collapsed")
        }

        if (expandSidebarBtn) {
          if (sidebar.classList.contains("collapsed")) {
            expandSidebarBtn.style.display = "block"
          } else {
            expandSidebarBtn.style.display = "none"
          }
        }
        updateSidebarLogo()
      }
    })
  }

  if (expandSidebarBtn) {
    expandSidebarBtn.addEventListener("click", () => {
      sidebar.classList.remove("collapsed")
      if (mainWrapper) {
        mainWrapper.classList.remove("sidebar-collapsed")
      }
      expandSidebarBtn.style.display = "none"
      updateSidebarLogo()
    })
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      navLinks.forEach((l) => l.classList.remove("active"))
      this.classList.add("active")
      const targetSection = this.getAttribute("href").substring(1)
      showSection(targetSection)
    })
  })

  function showSection(sectionId) {
    sections.forEach((section) => section.classList.remove("active"))
    const targetSection = document.getElementById(sectionId)
    if (targetSection) targetSection.classList.add("active")
  }

  function toggleOverlay() {
    let overlay = document.querySelector(".sidebar-overlay")
    if (!overlay) {
      overlay = document.createElement("div")
      overlay.className = "sidebar-overlay"
      document.body.appendChild(overlay)

      overlay.addEventListener("click", () => {
        sidebar.classList.remove("mobile-open")
        removeOverlay()
      })
    }
    overlay.classList.toggle("active")
  }

  function removeOverlay() {
    const overlay = document.querySelector(".sidebar-overlay")
    if (overlay) overlay.classList.remove("active")
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      sidebar.classList.remove("mobile-open")
      removeOverlay()
    }
  })

  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768) {
      if (sidebar && sidebarToggle && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
        sidebar.classList.remove("mobile-open")
        removeOverlay()
      }
    }
  })

  const themeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === "data-theme") {
        updateSidebarLogo()
      }
    })
  })

  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  })

  updateSidebarLogo()
})
