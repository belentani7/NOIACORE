import numpy as np
import math
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Callable, Any
import heapq

@dataclass
class WorldState:
    state_hash: str
    features: dict
    timestamp: float
    parent: str = None
    depth: int = 0

@dataclass
class FutureBranch:
    state: WorldState
    action: str
    reward: float = 0.0
    visits: int = 0
    value_sum: float = 0.0
    children: list = field(default_factory=list)
    
    @property
    def q_value(self) -> float:
        return self.value_sum / self.visits if self.visits > 0 else 0.0

class WorldModelSimulator:
    """
    Simula futuros posibles mediante Monte Carlo Tree Search + 
    modelo de transición aprendido. Permite al agente "soñar" 
    consecuencias antes de actuar.
    """
    
    def __init__(self, transition_model: Callable, reward_model: Callable,
                 exploration_constant: float = 1.414, curator=None):  # sqrt(2) óptimo UCT
        self.transition = transition_model
        self.reward = reward_model
        self.c = exploration_constant
        self.curator = curator
        self.tree: dict[str, FutureBranch] = {}
        self.simulation_count = 0
    
    def select_action(self, current_state: WorldState, 
                      legal_actions: list[str],
                      horizon: int = 5,
                      simulations: int = 1000) -> tuple[str, float]:
        """
        Selecciona la mejor acción simulando 'simulations' futuros.
        Retorna (acción, confianza).
        """
        root_key = current_state.state_hash
        if root_key not in self.tree:
            self.tree[root_key] = FutureBranch(
                state=current_state, action="ROOT"
            )
        
        for _ in range(simulations):
            self._simulate(root_key, current_state, legal_actions, horizon)
        
        # Seleccionar mejor hijo por visita (más robusto que Q puro)
        root = self.tree[root_key]
        if not root.children:
            return self._fallback_action(legal_actions), 0.5
        
        best = max(root.children, key=lambda c: c.visits)
        confidence = best.visits / sum(c.visits for c in root.children)
        return best.action, confidence
    
    def _simulate(self, node_key: str, state: WorldState,
                  actions: list[str], horizon: int) -> float:
        if state.depth >= horizon:
            return self.reward(state)
        
        # UCT: Upper Confidence Bound for Trees
        node = self.tree[node_key]
        untried = [a for a in actions if a not in 
                   {c.action for c in node.children}]
        
        if untried:
            action = untried[0]
        else:
            # Explotación: UCT formula
            log_parent = math.log(max(node.visits, 1))
            best_uct = float("-inf")
            best_child = None
            for child in node.children:
                uct = child.q_value + self.c * math.sqrt(
                    log_parent / max(child.visits, 1)
                )
                if uct > best_uct:
                    best_uct = uct
                    best_child = child
            action = best_child.action
        
        # Transición
        next_state_dict = self.transition(state.features, action)
        next_state = WorldState(
            state_hash=self._hash_state(next_state_dict),
            features=next_state_dict,
            timestamp=state.timestamp + 1,
            parent=node_key,
            depth=state.depth + 1
        )
        
        next_key = next_state.state_hash
        if next_key not in self.tree:
            self.tree[next_key] = FutureBranch(
                state=next_state, action=action
            )
        
        child_branch = self.tree[next_key]
        if child_branch not in node.children:
            node.children.append(child_branch)
        
        # Recursión
        legal_next = list(next_state_dict.get("legal_actions", actions))
        reward = self._simulate(next_key, next_state, legal_next, horizon)
        
        # Backpropagation
        child_branch.visits += 1
        child_branch.value_sum += reward
        return reward
    
    def _hash_state(self, features: dict) -> str:
        import hashlib, json
        return hashlib.sha256(
            json.dumps(features, sort_keys=True).encode()
        ).hexdigest()[:32]
    
    def _fallback_action(self, actions: list[str]) -> str:
        return actions[0] if actions else "noop"
