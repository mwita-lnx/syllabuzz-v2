import React, { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { Send, Sparkles } from 'lucide-react';
import { useRoomContext } from '../shared/RoomContext';

interface AITutorInterfaceProps {
  colors: any;
  roomId: string;
  topic: string;
}

export const AITutorInterface: React.FC<AITutorInterfaceProps> = ({ colors, roomId, topic }) => {
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [currentAIResponse, setCurrentAIResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { sendMessage } = useRoomContext();

  const handleSendAIQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aiQuestion.trim()) return;
    
    // Show loading state
    setIsLoading(true);
    setCurrentAIResponse('Thinking...');
    
    // Add the user's question to the chat
    try {
      // Format for AI conversation
      const aiPrompt = `[AI Tutor Question] ${aiQuestion}`;
      await sendMessage(aiPrompt);
      
      // Simulate AI response after a delay
      setTimeout(() => {
        // Mock AI response based on the question
        let aiResponse = '';
        
        if (aiQuestion.toLowerCase().includes('sort')) {
          aiResponse = 'Sorting algorithms are methods used to rearrange elements in a list or array based on a comparison operator. Common sorting algorithms include:\n\n1. **Quick Sort**: Average time complexity O(n log n), divide and conquer approach.\n2. **Merge Sort**: Consistent O(n log n) time complexity, stable sort algorithm.\n3. **Heap Sort**: O(n log n) time complexity, in-place sorting.\n4. **Bubble Sort**: Simple but inefficient with O(n²) time complexity.\n\nWhen comparing sorting algorithms, consider factors like time complexity, space complexity, stability, and whether the algorithm is adaptive.';
        } else if (aiQuestion.toLowerCase().includes('tree') || aiQuestion.toLowerCase().includes('traversal')) {
          aiResponse = 'Tree traversal methods are used to visit all nodes in a tree data structure. The three main traversal methods are:\n\n1. **Preorder**: Visit root first, then left subtree, then right subtree (Root-Left-Right).\n2. **Inorder**: Visit left subtree first, then root, then right subtree (Left-Root-Right). In a binary search tree, this visits nodes in ascending order.\n3. **Postorder**: Visit left subtree first, then right subtree, then root (Left-Right-Root).\n4. **Level Order**: Visit nodes level by level from top to bottom.\n\nThese traversals can be implemented using recursive or iterative approaches.';
        } else if (aiQuestion.toLowerCase().includes('dynamic') || aiQuestion.toLowerCase().includes('programming')) {
          aiResponse = 'Dynamic Programming is a method for solving complex problems by breaking them down into simpler subproblems. Its applicable when:\n\n1. The problem has optimal substructure (optimal solution contains optimal solutions to subproblems).\n2. The problem has overlapping subproblems (same subproblems are solved multiple times).\n\nImplementation approaches:\n1. **Top-down (Memoization)**: Recursive approach with caching of results.\n2. **Bottom-up (Tabulation)**: Iterative approach building solutions from smallest subproblems up.\n\nClassic DP problems include the Fibonacci sequence, knapsack problem, longest common subsequence, and shortest path algorithms.';
        } else {
          aiResponse = `I understand you're asking about "${aiQuestion}". This is an important concept related to ${topic}. When studying this topic, focus on understanding the fundamental principles first, then explore specific applications and implementations. Would you like me to provide more specific information about any particular aspect of this topic?`;
        }
        
        // Add the AI's response to the chat
        sendMessage(`[AI Tutor Response] ${aiResponse}`);
        
        // Clear the form and loading state
        setAiQuestion('');
        setCurrentAIResponse('');
        setIsLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error sending AI question:', error);
      setCurrentAIResponse('Sorry, there was an error processing your question. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setAiQuestion(question);
  };

  return (
    <div className="border rounded-lg p-4" style={{ borderColor: colors.quaternary }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.quaternary }}>
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold" style={{ color: colors.quaternary }}>AI Study Tutor</h3>
          <p className="text-sm" style={{ color: colors.textSecondary }}>Ask anything about your study material</p>
        </div>
      </div>
      
      {currentAIResponse && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${colors.quaternary}15`, color: colors.textPrimary }}>
          {currentAIResponse}
        </div>
      )}
      
      <form onSubmit={handleSendAIQuestion} className="flex gap-2">
        <Input
          type="text"
          placeholder="Ask a question about this topic..."
          value={aiQuestion}
          onChange={(e) => setAiQuestion(e.target.value)}
          className="flex-1"
          style={{ borderColor: colors.quaternary }}
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          style={{ backgroundColor: colors.quaternary, color: 'white' }}
          disabled={isLoading}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
      
      <div className="mt-4">
        <p className="text-xs mb-2" style={{ color: colors.textSecondary }}>Suggested questions:</p>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            style={{ borderColor: colors.quaternary, color: colors.quaternary }}
            onClick={() => handleSuggestedQuestion('Explain the time complexity of sorting algorithms')}
            disabled={isLoading}
          >
            Sorting algorithms
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            style={{ borderColor: colors.quaternary, color: colors.quaternary }}
            onClick={() => handleSuggestedQuestion('How do tree traversal algorithms work?')}
            disabled={isLoading}
          >
            Tree traversals
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            style={{ borderColor: colors.quaternary, color: colors.quaternary }}
            onClick={() => handleSuggestedQuestion('Explain dynamic programming with examples')}
            disabled={isLoading}
          >
            Dynamic programming
          </Button>
        </div>
      </div>
    </div>
  );
};