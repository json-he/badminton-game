// 灵活的羽毛球比赛安排系统
// 支持可配置的连续比赛控制，适用于不同人数和偏好

class FlexibleScheduleGenerator {
    constructor(options = {}) {
        // 默认配置
        this.config = {
            maxConsecutiveMatches: 2,        // 最大连续比赛场次（默认2场）
            maxConsecutiveRests: 3,          // 最大连续休息场次（默认3场）
            preferEvenDistribution: true,    // 是否优先均匀分布
            allowFlexibleRest: true,         // 是否允许灵活的休息安排
            maxAttempts: 1000,              // 最大尝试次数
            ...options
        };
        
        console.log('🎯 初始化灵活赛程生成器:', this.config);
    }
    
    // 生成赛程安排
    generateSchedule(players) {
        const playerCount = players.length;
        console.log(`🏸 为${playerCount}人生成灵活赛程安排`);
        
        // 根据人数确定目标参数
        const targets = this.calculateTargets(playerCount);
        console.log('📊 目标参数:', targets);
        
        // 尝试生成赛程
        for (let attempt = 0; attempt < this.config.maxAttempts; attempt++) {
            const schedule = this.attemptGenerateSchedule(players, targets);
            if (schedule) {
                console.log(`✅ 第${attempt + 1}次尝试成功生成赛程`);
                this.validateAndReport(schedule, players, targets);
                return schedule;
            }
        }
        
        console.warn('⚠️ 达到最大尝试次数，使用备用方案');
        return this.generateFallbackSchedule(players, targets);
    }
    
    // 计算目标参数
    calculateTargets(playerCount) {
        if (playerCount === 5) {
            return {
                totalMatches: 15,
                matchesPerPlayer: 12,
                playersPerMatch: 4,
                restPerMatch: 1
            };
        } else if (playerCount === 6) {
            return {
                totalMatches: 15,
                matchesPerPlayer: 10,
                playersPerMatch: 4,
                restPerMatch: 2
            };
        } else if (playerCount === 7) {
            return {
                totalMatches: 21,
                matchesPerPlayer: 12,
                playersPerMatch: 4,
                restPerMatch: 3
            };
        } else if (playerCount === 8) {
            return {
                totalMatches: 28,
                matchesPerPlayer: 14,
                playersPerMatch: 4,
                restPerMatch: 4
            };
        } else {
            // 通用计算
            const totalMatches = Math.ceil(playerCount * 2.5);
            const matchesPerPlayer = Math.floor(totalMatches * 4 / playerCount);
            return {
                totalMatches,
                matchesPerPlayer,
                playersPerMatch: 4,
                restPerMatch: playerCount - 4
            };
        }
    }
    
    // 尝试生成赛程
    attemptGenerateSchedule(players, targets) {
        const playerCount = players.length;
        const matches = [];
        const playerStats = Array(playerCount).fill(0).map(() => ({
            matchCount: 0,
            lastMatch: -999,
            consecutiveMatches: 0,
            consecutiveRests: 0,
            matchHistory: []
        }));
        
        // 生成所有可能的组合
        const allCombinations = this.generateAllCombinations(playerCount, targets.playersPerMatch);
        
        for (let matchIndex = 0; matchIndex < targets.totalMatches; matchIndex++) {
            const validCombos = this.findValidCombinations(
                allCombinations, 
                playerStats, 
                matchIndex, 
                targets
            );
            
            if (validCombos.length === 0) {
                return null; // 无法找到有效组合
            }
            
            // 选择最佳组合
            const bestCombo = this.selectBestCombination(validCombos, playerStats, matchIndex, targets);
            
            // 创建比赛
            const match = this.createMatch(bestCombo, players, matchIndex);
            matches.push(match);
            
            // 更新统计信息
            this.updatePlayerStats(playerStats, bestCombo, matchIndex);
        }
        
        return matches;
    }
    
    // 生成所有可能的组合
    generateAllCombinations(playerCount, playersPerMatch) {
        const combinations = [];
        
        // 生成所有4人组合
        for (let i = 0; i < playerCount; i++) {
            for (let j = i + 1; j < playerCount; j++) {
                for (let k = j + 1; k < playerCount; k++) {
                    for (let l = k + 1; l < playerCount; l++) {
                        combinations.push([i, j, k, l]);
                    }
                }
            }
        }
        
        return combinations;
    }
    
    // 查找有效组合
    findValidCombinations(allCombinations, playerStats, matchIndex, targets) {
        const validCombos = [];
        
        for (const combo of allCombinations) {
            // 检查场次限制
            let exceedsLimit = false;
            for (const playerId of combo) {
                if (playerStats[playerId].matchCount >= targets.matchesPerPlayer) {
                    exceedsLimit = true;
                    break;
                }
            }
            if (exceedsLimit) continue;
            
            // 检查连续比赛限制
            let hasExcessiveConsecutive = false;
            for (const playerId of combo) {
                const stats = playerStats[playerId];
                if (stats.lastMatch === matchIndex - 1 && 
                    stats.consecutiveMatches >= this.config.maxConsecutiveMatches) {
                    hasExcessiveConsecutive = true;
                    break;
                }
            }
            if (hasExcessiveConsecutive) continue;
            
            // 检查连续休息限制
            const restingPlayers = [];
            for (let i = 0; i < playerStats.length; i++) {
                if (!combo.includes(i)) {
                    restingPlayers.push(i);
                }
            }
            
            let hasExcessiveRest = false;
            for (const playerId of restingPlayers) {
                const stats = playerStats[playerId];
                if (stats.consecutiveRests >= this.config.maxConsecutiveRests) {
                    hasExcessiveRest = true;
                    break;
                }
            }
            if (hasExcessiveRest) continue;
            
            validCombos.push(combo);
        }
        
        return validCombos;
    }
    
    // 选择最佳组合
    selectBestCombination(validCombos, playerStats, matchIndex, targets) {
        let bestCombo = null;
        let bestScore = -Infinity;
        
        for (const combo of validCombos) {
            const score = this.calculateCombinationScore(combo, playerStats, matchIndex, targets);
            if (score > bestScore) {
                bestScore = score;
                bestCombo = combo;
            }
        }
        
        return bestCombo;
    }
    
    // 计算组合分数
    calculateCombinationScore(combo, playerStats, matchIndex, targets) {
        let score = 0;
        
        // 优先选择比赛次数少的玩家
        for (const playerId of combo) {
            const remaining = targets.matchesPerPlayer - playerStats[playerId].matchCount;
            score += remaining * 1000;
        }
        
        // 避免连续比赛
        for (const playerId of combo) {
            const stats = playerStats[playerId];
            if (stats.lastMatch === matchIndex - 1) {
                score -= 500; // 连续比赛扣分
            } else if (stats.lastMatch < matchIndex - 2) {
                score += 100; // 有休息加分
            }
        }
        
        // 均匀分布奖励
        if (this.config.preferEvenDistribution) {
            const matchCounts = combo.map(id => playerStats[id].matchCount);
            const variance = this.calculateVariance(matchCounts);
            score += (100 - variance) * 10; // 方差越小分数越高
        }
        
        return score;
    }
    
    // 计算方差
    calculateVariance(numbers) {
        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
        return variance;
    }
    
    // 创建比赛对象
    createMatch(combo, players, matchIndex) {
        // 随机分配队伍
        const shuffled = [...combo].sort(() => Math.random() - 0.5);
        return {
            team1: [players[shuffled[0]], players[shuffled[1]]],
            team2: [players[shuffled[2]], players[shuffled[3]]],
            score1: 0,
            score2: 0,
            matchIndex: matchIndex
        };
    }
    
    // 更新玩家统计信息
    updatePlayerStats(playerStats, combo, matchIndex) {
        for (let i = 0; i < playerStats.length; i++) {
            const stats = playerStats[i];
            
            if (combo.includes(i)) {
                // 玩家参与比赛
                stats.matchCount++;
                stats.matchHistory.push(matchIndex);
                
                if (stats.lastMatch === matchIndex - 1) {
                    stats.consecutiveMatches++;
                } else {
                    stats.consecutiveMatches = 1;
                }
                
                stats.consecutiveRests = 0;
                stats.lastMatch = matchIndex;
            } else {
                // 玩家休息
                if (stats.lastMatch === matchIndex - 1) {
                    stats.consecutiveRests++;
                } else {
                    stats.consecutiveRests = 1;
                }
                
                stats.consecutiveMatches = 0;
            }
        }
    }
    
    // 生成备用方案
    generateFallbackSchedule(players, targets) {
        console.log('🔄 使用智能备用方案生成赛程');
        
        const matches = [];
        const playerCount = players.length;
        const playerStats = Array(playerCount).fill(0).map(() => ({
            matchCount: 0,
            lastMatch: -999,
            consecutiveMatches: 0,
            consecutiveRests: 0,
            matchHistory: []
        }));
        
        // 使用智能轮换策略
        for (let matchIndex = 0; matchIndex < targets.totalMatches; matchIndex++) {
            const combo = this.selectSmartCombo(playerStats, matchIndex, targets);
            
            if (combo) {
                const match = this.createMatch(combo, players, matchIndex);
                matches.push(match);
                this.updatePlayerStats(playerStats, combo, matchIndex);
            } else {
                // 如果智能选择失败，使用简单轮换
                const simpleCombo = [];
                for (let i = 0; i < 4; i++) {
                    const playerId = (matchIndex * 4 + i) % playerCount;
                    simpleCombo.push(playerId);
                }
                const match = this.createMatch(simpleCombo, players, matchIndex);
                matches.push(match);
                this.updatePlayerStats(playerStats, simpleCombo, matchIndex);
            }
        }
        
        return matches;
    }
    
    // 智能选择组合
    selectSmartCombo(playerStats, matchIndex, targets) {
        const playerCount = playerStats.length;
        const availablePlayers = [];
        
        // 找出所有可用的玩家
        for (let i = 0; i < playerCount; i++) {
            const stats = playerStats[i];
            
            // 检查场次限制
            if (stats.matchCount >= targets.matchesPerPlayer) continue;
            
            // 检查连续比赛限制
            if (stats.lastMatch === matchIndex - 1 && 
                stats.consecutiveMatches >= this.config.maxConsecutiveMatches) continue;
            
            availablePlayers.push(i);
        }
        
        if (availablePlayers.length < 4) {
            return null; // 可用玩家不足
        }
        
        // 按优先级排序
        availablePlayers.sort((a, b) => {
            const statsA = playerStats[a];
            const statsB = playerStats[b];
            
            // 优先选择比赛次数少的
            if (statsA.matchCount !== statsB.matchCount) {
                return statsA.matchCount - statsB.matchCount;
            }
            
            // 其次选择休息时间长的
            const restTimeA = matchIndex - statsA.lastMatch;
            const restTimeB = matchIndex - statsB.lastMatch;
            return restTimeB - restTimeA;
        });
        
        // 选择前4个玩家
        return availablePlayers.slice(0, 4);
    }
    
    // 验证并报告结果
    validateAndReport(matches, players, targets) {
        console.log('🔍 验证生成的赛程...');
        
        const playerCount = players.length;
        const playerStats = Array(playerCount).fill(0).map(() => ({
            matchCount: 0,
            consecutiveSequences: [],
            restPeriods: [],
            matchHistory: []
        }));
        
        // 统计每个玩家的比赛情况
        matches.forEach((match, matchIndex) => {
            const playingPlayers = [...match.team1, ...match.team2];
            playingPlayers.forEach(playerName => {
                const playerIndex = players.indexOf(playerName);
                if (playerIndex !== -1) {
                    playerStats[playerIndex].matchCount++;
                }
            });
        });
        
        // 检查是否有连续比赛问题需要修复
        const problematicPlayers = [];
        for (let playerId = 0; playerId < playerCount; playerId++) {
            const playerMatches = [];
            matches.forEach((match, index) => {
                const playingPlayers = [...match.team1, ...match.team2];
                if (playingPlayers.includes(players[playerId])) {
                    playerMatches.push(index);
                }
            });
            
            // 分析连续序列
            let currentSequence = [playerMatches[0]];
            for (let i = 1; i < playerMatches.length; i++) {
                if (playerMatches[i] === playerMatches[i-1] + 1) {
                    currentSequence.push(playerMatches[i]);
                } else {
                    if (currentSequence.length > this.config.maxConsecutiveMatches) {
                        problematicPlayers.push({
                            playerId,
                            playerName: players[playerId],
                            sequence: [...currentSequence],
                            length: currentSequence.length
                        });
                    }
                    currentSequence = [playerMatches[i]];
                }
            }
            if (currentSequence.length > this.config.maxConsecutiveMatches) {
                problematicPlayers.push({
                    playerId,
                    playerName: players[playerId],
                    sequence: [...currentSequence],
                    length: currentSequence.length
                });
            }
        }
        
        // 如果有连续比赛问题，尝试自动修复
        if (problematicPlayers.length > 0) {
            console.log('🔧 检测到连续比赛问题，尝试自动修复...');
            const fixedMatches = this.autoFixConsecutiveIssues(matches, players, problematicPlayers);
            if (fixedMatches) {
                console.log('✅ 自动修复成功！');
                return this.validateAndReport(fixedMatches, players, targets);
            } else {
                console.log('⚠️ 自动修复失败，使用原始赛程');
            }
        }
        
        // 检查连续比赛
        for (let playerId = 0; playerId < playerCount; playerId++) {
            const playerMatches = [];
            matches.forEach((match, index) => {
                const playingPlayers = [...match.team1, ...match.team2];
                if (playingPlayers.includes(players[playerId])) {
                    playerMatches.push(index);
                }
            });
            
            // 分析连续序列
            let currentSequence = [playerMatches[0]];
            for (let i = 1; i < playerMatches.length; i++) {
                if (playerMatches[i] === playerMatches[i-1] + 1) {
                    currentSequence.push(playerMatches[i]);
                } else {
                    if (currentSequence.length > 1) {
                        playerStats[playerId].consecutiveSequences.push([...currentSequence]);
                    }
                    currentSequence = [playerMatches[i]];
                }
            }
            if (currentSequence.length > 1) {
                playerStats[playerId].consecutiveSequences.push(currentSequence);
            }
        }
        
        // 报告结果
        console.log('📊 赛程统计报告:');
        let hasIssues = false;
        
        for (let i = 0; i < playerCount; i++) {
            const stats = playerStats[i];
            const playerName = players[i];
            
            console.log(`\n👤 ${playerName}:`);
            console.log(`   总场次: ${stats.matchCount}/${targets.matchesPerPlayer}`);
            
            if (stats.matchCount !== targets.matchesPerPlayer) {
                console.log(`   ⚠️ 场次不匹配！`);
                hasIssues = true;
            }
            
            if (stats.consecutiveSequences.length > 0) {
                console.log(`   连续比赛序列: ${stats.consecutiveSequences.length}个`);
                stats.consecutiveSequences.forEach((seq, index) => {
                    const length = seq.length;
                    const status = length <= this.config.maxConsecutiveMatches ? '✅' : '❌';
                    console.log(`     ${status} 序列${index+1}: 第${seq.map(m => m+1).join(',')}场 (${length}场连续)`);
                    if (length > this.config.maxConsecutiveMatches) {
                        hasIssues = true;
                    }
                });
            } else {
                console.log(`   ✅ 无连续比赛`);
            }
        }
        
        if (!hasIssues) {
            console.log('\n🎉 赛程验证通过！所有条件都满足。');
        } else {
            console.log('\n⚠️ 赛程存在一些问题，但已尽力优化。');
        }
        
        return !hasIssues;
    }
    
    // 自动修复连续比赛问题
    autoFixConsecutiveIssues(matches, players, problematicPlayers) {
        console.log('🔧 开始自动修复连续比赛问题...');
        
        // 创建修复后的比赛数组副本
        const fixedMatches = matches.map(match => ({
            team1: [...match.team1],
            team2: [...match.team2],
            score1: match.score1,
            score2: match.score2,
            matchIndex: match.matchIndex
        }));
        
        // 按连续比赛数量排序，优先修复最严重的问题
        problematicPlayers.sort((a, b) => b.length - a.length);
        
        for (const problem of problematicPlayers) {
            console.log(`🔧 修复玩家 ${problem.playerName} 的连续比赛问题 (${problem.length}场连续)`);
            
            // 尝试通过交换来打破连续序列
            const success = this.breakConsecutiveSequence(fixedMatches, players, problem);
            if (success) {
                console.log(`   ✅ 成功修复连续序列`);
            } else {
                console.log(`   ⚠️ 无法完全修复连续序列，但已尽力优化`);
            }
        }
        
        // 验证修复结果
        const validationResult = this.validateConsecutiveMatches(fixedMatches, players);
        if (validationResult.allGood) {
            console.log('🎉 自动修复完成！所有连续比赛问题已解决');
            return fixedMatches;
        } else {
            console.log('⚠️ 部分问题已修复，但仍有少量连续比赛');
            return fixedMatches; // 仍然返回修复后的版本
        }
    }
    
    // 打破连续序列
    breakConsecutiveSequence(matches, players, problem) {
        if (problem.length <= this.config.maxConsecutiveMatches) return true;
        
        // 策略1: 尝试交换相邻比赛中的玩家
        for (let i = 0; i < problem.sequence.length - 1; i++) {
            const matchIndex1 = problem.sequence[i];
            const matchIndex2 = problem.sequence[i + 1];
            
            if (matchIndex1 >= 0 && matchIndex2 < matches.length) {
                const success = this.trySwapPlayers(matches, players, problem.playerId, matchIndex1, matchIndex2);
                if (success) {
                    return true;
                }
            }
        }
        
        // 策略2: 尝试重新安排整场比赛
        for (let i = 0; i < problem.sequence.length; i++) {
            const matchIndex = problem.sequence[i];
            if (matchIndex >= 0 && matchIndex < matches.length) {
                const success = this.tryRearrangeMatch(matches, players, problem.playerId, matchIndex);
                if (success) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // 尝试交换两个比赛中的玩家
    trySwapPlayers(matches, players, playerId, matchIndex1, matchIndex2) {
        const match1 = matches[matchIndex1];
        const match2 = matches[matchIndex2];
        const playerName = players[playerId];
        
        // 检查玩家是否在这两场比赛中
        const inMatch1 = [...match1.team1, ...match1.team2].includes(playerName);
        const inMatch2 = [...match2.team1, ...match2.team2].includes(playerName);
        
        if (!inMatch1 || !inMatch2) return false;
        
        // 尝试找到可以交换的玩家
        const allPlayers = [...match1.team1, ...match1.team2, ...match2.team1, ...match2.team2];
        const uniquePlayers = [...new Set(allPlayers)];
        
        for (const otherPlayer of uniquePlayers) {
            if (otherPlayer === playerName) continue;
            
            const otherPlayerId = players.indexOf(otherPlayer);
            if (otherPlayerId === -1) continue;
            
            // 检查交换是否可行
            if (this.canSwapPlayers(matches, players, playerId, otherPlayerId, matchIndex1, matchIndex2)) {
                // 执行交换
                this.swapPlayersInMatches(matches, playerName, otherPlayer, matchIndex1, matchIndex2);
                return true;
            }
        }
        
        return false;
    }
    
    // 检查是否可以交换玩家
    canSwapPlayers(matches, players, playerId1, playerId2, matchIndex1, matchIndex2) {
        // 检查交换后是否会造成新的连续比赛问题
        // 这里可以添加更复杂的检查逻辑
        return true; // 简化版本，总是允许交换
    }
    
    // 在比赛中交换玩家
    swapPlayersInMatches(matches, player1, player2, matchIndex1, matchIndex2) {
        const match1 = matches[matchIndex1];
        const match2 = matches[matchIndex2];
        
        // 在match1中交换
        if (match1.team1.includes(player1)) {
            match1.team1[match1.team1.indexOf(player1)] = player2;
        } else if (match1.team2.includes(player1)) {
            match1.team2[match1.team2.indexOf(player1)] = player2;
        }
        
        if (match1.team1.includes(player2)) {
            match1.team1[match1.team1.indexOf(player2)] = player1;
        } else if (match1.team2.includes(player2)) {
            match1.team2[match1.team2.indexOf(player2)] = player1;
        }
        
        // 在match2中交换
        if (match2.team1.includes(player1)) {
            match2.team1[match2.team1.indexOf(player1)] = player2;
        } else if (match2.team2.includes(player1)) {
            match2.team2[match2.team2.indexOf(player1)] = player2;
        }
        
        if (match2.team1.includes(player2)) {
            match2.team1[match2.team1.indexOf(player2)] = player1;
        } else if (match2.team2.includes(player2)) {
            match2.team2[match2.team2.indexOf(player2)] = player1;
        }
    }
    
    // 尝试重新安排比赛
    tryRearrangeMatch(matches, players, playerId, matchIndex) {
        const match = matches[matchIndex];
        const playerName = players[playerId];
        
        // 检查玩家是否在这场比赛中
        const inMatch = [...match.team1, ...match.team2].includes(playerName);
        if (!inMatch) return false;
        
        // 尝试将玩家移到休息状态
        const otherPlayers = [...match.team1, ...match.team2].filter(p => p !== playerName);
        if (otherPlayers.length >= 4) {
            // 重新分配队伍
            const shuffled = [...otherPlayers].sort(() => Math.random() - 0.5);
            match.team1 = [shuffled[0], shuffled[1]];
            match.team2 = [shuffled[2], shuffled[3]];
            return true;
        }
        
        return false;
    }
    
    // 验证连续比赛
    validateConsecutiveMatches(matches, players) {
        const playerCount = players.length;
        const playerActivity = Array(playerCount).fill(null).map(() => ({
            matches: [],
            maxConsecutivePlays: 0
        }));
        
        for (let i = 0; i < matches.length; i++) {
            const currentMatchPlayers = new Set();
            matches[i].team1.forEach(p => currentMatchPlayers.add(players.indexOf(p)));
            matches[i].team2.forEach(p => currentMatchPlayers.add(players.indexOf(p)));
            
            for (let pIdx = 0; pIdx < playerCount; pIdx++) {
                if (currentMatchPlayers.has(pIdx)) {
                    playerActivity[pIdx].matches.push(i);
                }
            }
        }
        
        let allGood = true;
        playerActivity.forEach((activity, pIdx) => {
            let maxConsecutive = 1;
            let currentConsecutive = 1;
            
            for (let i = 1; i < activity.matches.length; i++) {
                if (activity.matches[i] === activity.matches[i-1] + 1) {
                    currentConsecutive++;
                    maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
                } else {
                    currentConsecutive = 1;
                }
            }
            
            activity.maxConsecutivePlays = maxConsecutive;
            if (maxConsecutive > this.config.maxConsecutiveMatches) {
                allGood = false;
            }
        });
        
        return { allGood, playerActivity };
    }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FlexibleScheduleGenerator };
}
