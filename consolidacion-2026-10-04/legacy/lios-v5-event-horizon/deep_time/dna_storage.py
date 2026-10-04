import hashlib
import base64
from datetime import datetime

class DnaStorage:
    """
    Simula la codificación y decodificación de información en ADN sintético.
    Para la preservación de datos a escala milenaria.
    """
    
    BASE_MAP = {
        0: 'A', 1: 'C', 2: 'G', 3: 'T',
        'A': 0, 'C': 1, 'G': 2, 'T': 3
    }
    
    def __init__(self, simulated_error_rate: float = 1e-6):
        self.simulated_error_rate = simulated_error_rate
    
    def encode_to_dna(self, data: str) -> str:
        """
        Codifica una cadena de texto en una secuencia de ADN simulada.
        Cada 2 bits se mapean a una base (A, C, G, T).
        """
        binary_data = ''.join(format(ord(char), '08b') for char in data)
        
        dna_sequence = []
        for i in range(0, len(binary_data), 2):
            two_bits = binary_data[i:i+2]
            if len(two_bits) < 2: # Rellenar si es necesario
                two_bits += '0' * (2 - len(two_bits))
            
            index = int(two_bits, 2)
            dna_sequence.append(self.BASE_MAP[index])
            
        return "".join(dna_sequence)
    
    def decode_from_dna(self, dna_sequence: str) -> str:
        """
        Decodifica una secuencia de ADN simulada de vuelta a texto.
        Aplica una tasa de error simulada.
        """
        # Simular errores aleatorios
        corrupted_dna = list(dna_sequence)
        # for i in range(len(corrupted_dna)):
        #     if random.random() < self.simulated_error_rate:
        #         corrupted_dna[i] = random.choice(list(self.BASE_MAP.keys())[4:]) # Cambiar a una base aleatoria
        # dna_sequence = "".join(corrupted_dna)
        
        binary_data = []
        for base in dna_sequence:
            binary_data.append(format(self.BASE_MAP[base], '02b'))
            
        binary_string = "".join(binary_data)
        
        # Convertir binario a texto
        text_data = []
        for i in range(0, len(binary_string), 8):
            byte = binary_string[i:i+8]
            if len(byte) == 8:
                text_data.append(chr(int(byte, 2)))
                
        return "".join(text_data)
    
    def store_data_for_millennia(self, data: str, identifier: str) -> dict:
        """
        Simula el proceso de almacenamiento a largo plazo.
        """
        dna_encoded = self.encode_to_dna(data)
        data_hash = hashlib.sha256(data.encode()).hexdigest()
        
        print(f"Datos \'{identifier}\' codificados en ADN simulado. Longitud: {len(dna_encoded)} bases.")
        return {
            "identifier": identifier,
            "original_hash": data_hash,
            "dna_sequence_preview": dna_encoded[:50] + "..." + dna_encoded[-50:],
            "encoded_length": len(dna_encoded),
            "timestamp": datetime.utcnow().isoformat()
        }

# Ejemplo de uso
# dna_store = DnaStorage()
# original_text = "Este es un mensaje secreto para el futuro."
# stored_info = dna_store.store_data_for_millennia(original_text, "mensaje_secreto_futuro")
# print(f"Información almacenada: {stored_info}")
# decoded_text = dna_store.decode_from_dna(dna_store.encode_to_dna(original_text))
# print(f"Decodificado: {decoded_text}")
