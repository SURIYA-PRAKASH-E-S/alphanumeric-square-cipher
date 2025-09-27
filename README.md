# Alphanumeric Square Cipher

A web-based interactive tool to **encrypt and decrypt messages** using the **6x6 Alphanumeric Square Cipher**. This cipher supports both letters (A-Z) and digits (0-9), making it suitable for alphanumeric messages.

---

## Features

- **Encrypt / Decrypt** text with a secret key.
- **Interactive 6x6 grid** showing the cipher table.
- **Step-by-step visualization** of digraph processing.
- Automatically handles repeated letters and odd-length text using filler `X`.
- Fully **responsive design** using Bootstrap.
- Highlights letters being processed in real-time.

---

## How It Works

1. **Generate Grid:**  
   - Create a 6x6 grid with letters A-Z and digits 0-9.
   - Start with unique characters from the secret key (row-wise).
   - Then insert numbers (0–9) and alphabets in the pattern:
   ```
   digit → two alphabets → digit → two alphabets → ...
   ```
   - Skip duplicates.
   - Continue until the 6×6 grid (36 slots) is filled.

2. **Prepare Text:**  
   - Divide plaintext into digrams (pairs of letters).  
   - If letters repeat in a pair or the length is odd, insert `X` as filler.

3. **Encryption / Decryption Rules:**  
   - **Same Row:** Shift left (encrypt) or right (decrypt) by 2 positions.  
   - **Same Column:** Shift up (encrypt) or down (decrypt) by 2 positions.  
   - **Rectangle:** Swap the columns of the two letters.

4. **Combine Results:**  
   - Combine processed digrams to produce the final encrypted or decrypted text.

---

## Demo

- [[Live Demo Link](https://cryptal.netlify.app/)](#)

---

## Installation

1. **Clone the repository:**

```bash
git clone https://github.com/SURIYA-PRAKASH-E-S/alphanumeric-square-cipher.git
cd alphanumeric-square-cipher
```

2. **Install packages**
```bash
npm install
```

3. **Run**
   ```bash
   npm start
   ```
   
---
